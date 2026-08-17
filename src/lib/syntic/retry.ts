export async function withRetry<T>(operation: () => Promise<T>, options?: { attempts?: number; baseDelayMs?: number }) {
  const attempts = Math.min(Math.max(options?.attempts ?? 3, 1), 5);
  const baseDelayMs = options?.baseDelayMs ?? 250;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}
