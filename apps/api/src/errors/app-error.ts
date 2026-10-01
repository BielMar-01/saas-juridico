export type ErrorCode =
  | "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "UNAUTHORIZED"
  | "FORBIDDEN" | "AUTH_SERVICE_UNAVAILABLE" | "EMAIL_UNAVAILABLE" | "EMAIL_PENDING" | "RATE_LIMIT_EXCEEDED" | "DATABASE_UNAVAILABLE" | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = "AppError";
  }
}
