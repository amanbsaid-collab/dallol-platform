import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = signature.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expectedBuffer = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex"), "hex");
  return signatures.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate, "hex");
    return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  if (!signature || !verifyStripeSignature(payload, signature, secret)) return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });

  let event: { id: string; type: string; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(payload); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const metadata = ((event.data?.object ?? {}).metadata ?? {}) as Record<string, unknown>;
  const organizationId = typeof metadata.organization_id === "string" ? metadata.organization_id : null;
  if (!organizationId) return Response.json({ error: "Missing organization_id metadata" }, { status: 422 });

  try {
    const existing = await db.paymentEvent.findUnique({ where: { provider_providerEventId: { provider: "stripe", providerEventId: event.id } } });
    if (!existing) {
      await db.paymentEvent.create({
        data: {
          organizationId,
          provider: "stripe",
          providerEventId: event.id,
          eventType: event.type,
          payload: toJsonValue(event),
        },
      });
    }
  } catch { return Response.json({ error: "Persistence failed" }, { status: 500 }); }
  return Response.json({ received: true, eventId: event.id });
}
