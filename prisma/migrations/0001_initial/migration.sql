-- Dallol initial production schema migration.
-- Apply with `prisma migrate deploy` after DATABASE_URL is configured.

CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "ContactStatus" AS ENUM ('LEAD', 'QUALIFIED', 'CUSTOMER', 'LOST');
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST');
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "AgentType" AS ENUM ('SALES', 'SUPPORT', 'OPERATIONS', 'FINANCE', 'MARKETING', 'CUSTOM');

CREATE TABLE "Organization" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "name" TEXT, "image" TEXT, "passwordHash" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Membership" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE, CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE);
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");
CREATE TABLE "Session" ("id" TEXT NOT NULL PRIMARY KEY, "sessionToken" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL, "expires" TIMESTAMP(3) NOT NULL, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE TABLE "Account" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "type" TEXT NOT NULL, "provider" TEXT NOT NULL, "providerAccountId" TEXT NOT NULL, "refresh_token" TEXT, "access_token" TEXT, "expires_at" INTEGER, "token_type" TEXT, "scope" TEXT, "id_token" TEXT, "session_state" TEXT, CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE);
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE TABLE "VerificationToken" ("identifier" TEXT NOT NULL, "token" TEXT NOT NULL UNIQUE, "expires" TIMESTAMP(3) NOT NULL);
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE TABLE "Contact" ("id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT, "email" TEXT, "phone" TEXT, "company" TEXT, "status" "ContactStatus" NOT NULL DEFAULT 'LEAD', "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE);
CREATE INDEX "Contact_organizationId_status_idx" ON "Contact"("organizationId", "status");
CREATE INDEX "Contact_organizationId_email_idx" ON "Contact"("organizationId", "email");
CREATE TABLE "Pipeline" ("id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Pipeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE);
CREATE INDEX "Pipeline_organizationId_idx" ON "Pipeline"("organizationId");
CREATE TABLE "PipelineStage" ("id" TEXT NOT NULL PRIMARY KEY, "pipelineId" TEXT NOT NULL, "name" TEXT NOT NULL, "position" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE);
CREATE UNIQUE INDEX "PipelineStage_pipelineId_position_key" ON "PipelineStage"("pipelineId", "position");
CREATE TABLE "Deal" ("id" TEXT NOT NULL PRIMARY KEY, "contactId" TEXT NOT NULL, "pipelineId" TEXT NOT NULL, "stageId" TEXT NOT NULL, "name" TEXT NOT NULL, "valueCents" INTEGER NOT NULL DEFAULT 0, "status" "DealStatus" NOT NULL DEFAULT 'OPEN', "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE, CONSTRAINT "Deal_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE, CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE);
CREATE INDEX "Deal_pipelineId_stageId_status_idx" ON "Deal"("pipelineId", "stageId", "status");
CREATE TABLE "Workflow" ("id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT', "definition" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE);
CREATE INDEX "Workflow_organizationId_status_idx" ON "Workflow"("organizationId", "status");
CREATE TABLE "WorkflowRun" ("id" TEXT NOT NULL PRIMARY KEY, "workflowId" TEXT NOT NULL, "status" "RunStatus" NOT NULL DEFAULT 'QUEUED', "input" JSONB, "output" JSONB, "error" TEXT, "startedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE);
CREATE INDEX "WorkflowRun_workflowId_status_idx" ON "WorkflowRun"("workflowId", "status");
CREATE TABLE "Agent" ("id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "name" TEXT NOT NULL, "type" "AgentType" NOT NULL, "instructions" TEXT, "enabled" BOOLEAN NOT NULL DEFAULT TRUE, "config" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE);
CREATE INDEX "Agent_organizationId_enabled_idx" ON "Agent"("organizationId", "enabled");
CREATE TABLE "AgentRun" ("id" TEXT NOT NULL PRIMARY KEY, "agentId" TEXT NOT NULL, "workflowRunId" TEXT, "status" "RunStatus" NOT NULL DEFAULT 'QUEUED', "input" JSONB, "output" JSONB, "error" TEXT, "startedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE);
CREATE INDEX "AgentRun_agentId_status_idx" ON "AgentRun"("agentId", "status");
CREATE INDEX "AgentRun_workflowRunId_idx" ON "AgentRun"("workflowRunId");
CREATE TABLE "AuditEvent" ("id" TEXT NOT NULL PRIMARY KEY, "organizationId" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE, CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL);
CREATE INDEX "AuditEvent_organizationId_createdAt_idx" ON "AuditEvent"("organizationId", "createdAt");
CREATE INDEX "AuditEvent_organizationId_entityType_entityId_idx" ON "AuditEvent"("organizationId", "entityType", "entityId");
