/**
 * T020 + T021 + T031 + T032 — Normalised error hierarchy.
 *
 * Every non-2xx HTTP response and every request failure is mapped to a
 * small, named AppError subclass with a discriminated `kind` field. Feature
 * code switches on `kind`, not on `instanceof Error` or string matching.
 *
 * @see contracts/error-types.md
 */

export type ErrorKind =
  | "auth"
  | "validation"
  | "server"
  | "network"
  | "abort"
  | "unknown";

export interface AppErrorOptions {
  status?: number | null;
  details?: Record<string, unknown> | null;
  cause?: Error | null;
}

const DEFAULT_MESSAGES: Record<ErrorKind, (status?: number | null) => string> = {
  auth: (status) =>
    status === 403
      ? "You don't have permission to do that."
      : "Your session has expired. Please sign in again.",
  validation: () => "Some fields are not valid.",
  server: () => "Something went wrong on our end. Please try again.",
  network: () => "You appear to be offline.",
  abort: () => "The request was cancelled.",
  unknown: (status) =>
    status === 404
      ? "Not found."
      : status === 429
        ? "Too many requests. Please try again later."
        : "Something went wrong.",
};

export abstract class AppError extends Error {
  abstract readonly kind: ErrorKind;
  readonly status: number | null;
  readonly details: Record<string, unknown> | null;
  readonly cause: Error | null;

  constructor(
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.status = options.status ?? null;
    this.details = options.details ?? null;
    this.cause = options.cause ?? null;
    if (typeof (Error as unknown as { captureStackTrace?: unknown }).captureStackTrace === "function") {
      (Error as unknown as { captureStackTrace: (target: object, ctor: abstract new (...args: never[]) => unknown) => void }).captureStackTrace(
        this,
        new.target,
      );
    }
  }

  toUserMessage(): string {
    const apiMessage =
      this.details && typeof this.details === "object" && "message" in this.details
        ? (this.details as { message?: unknown }).message
        : undefined;
    if (typeof apiMessage === "string" && apiMessage.length > 0) {
      return apiMessage;
    }
    return DEFAULT_MESSAGES[this.kind](this.status);
  }

  toLogEntry(): Record<string, unknown> {
    return {
      kind: this.kind,
      status: this.status,
      message: this.message,
      details: this.details,
      causeMessage: this.cause ? this.cause.message : null,
      stack: this.stack ?? null,
    };
  }
}

export class AuthError extends AppError {
  readonly kind = "auth" as const;
}

export class ValidationError extends AppError {
  readonly kind = "validation" as const;
}

export class ServerError extends AppError {
  readonly kind = "server" as const;
}

export class NetworkError extends AppError {
  readonly kind = "network" as const;
}

export class AbortError extends AppError {
  readonly kind = "abort" as const;
}

export class UnknownError extends AppError {
  readonly kind = "unknown" as const;
}

/**
 * Maps an HTTP status code to the right AppError subclass.
 */
export function errorFromStatus(
  status: number,
  message: string,
  details?: Record<string, unknown> | null,
): AppError {
  if (status === 401 || status === 403) {
    return new AuthError(message, { status, details });
  }
  if (status === 400 || status === 409 || status === 422) {
    return new ValidationError(message, { status, details });
  }
  if (status >= 500) {
    return new ServerError(message, { status, details });
  }
  return new UnknownError(message, { status, details });
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
