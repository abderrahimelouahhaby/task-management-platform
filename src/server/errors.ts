export type ErrorCode =
  "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

export const unauthorized = (message = "You must be logged in.") =>
  new AppError("UNAUTHORIZED", message);

export const forbidden = (message = "You do not have permission to do that.") =>
  new AppError("FORBIDDEN", message);

export const notFound = (message = "Not found.") => new AppError("NOT_FOUND", message);

export const validationError = (message = "Invalid input.") =>
  new AppError("VALIDATION_ERROR", message);

export const conflict = (message = "This already exists.") => new AppError("CONFLICT", message);
