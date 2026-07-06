/**
 * Shared helpers for surfacing meaningful status messages to users.
 * Keeps error handling consistent across every API call in the app.
 */

/** Extract the server's error message from a failed Response body. */
export async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
}

/** Turn any caught value into a friendly, user-facing message. */
export function toErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  // `fetch` rejects with a TypeError when the server is unreachable
  // (offline, connection refused, CORS, DNS failure, etc.)
  if (error instanceof TypeError) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Basic email format check for client-side validation. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
