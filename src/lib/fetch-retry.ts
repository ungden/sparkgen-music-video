/**
 * Fetch with automatic retry and exponential backoff.
 * Retries on 429 (rate limit) and 5xx (server errors).
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (res.ok) return res;

      // Don't retry 4xx errors (except 429)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res;
      }

      // Retry on 429 or 5xx
      if (attempt < maxRetries && (res.status === 429 || res.status >= 500)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : delay;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      return res;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}
