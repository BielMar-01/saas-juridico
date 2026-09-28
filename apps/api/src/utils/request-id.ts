const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]+$/;
const MAX_REQUEST_ID_LENGTH = 128;

export function sanitizeRequestId(value: unknown, fallback: () => string = () => crypto.randomUUID()): string {
  if (typeof value !== "string") return fallback();
  const candidate = value.trim();
  if (
    candidate.length === 0 ||
    candidate.length > MAX_REQUEST_ID_LENGTH ||
    !SAFE_REQUEST_ID.test(candidate)
  ) {
    return fallback();
  }
  return candidate;
}
