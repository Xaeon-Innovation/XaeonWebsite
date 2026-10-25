/**
 * Message for a 500 response: the real error in development, a generic fallback in
 * production so driver/Google/Resend internals never reach the client.
 */
export function serverErrorMessage(err: unknown, fallback: string): string {
  if (process.env.NODE_ENV === "production") return fallback;
  return err instanceof Error ? err.message : fallback;
}
