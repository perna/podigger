/**
 * T013 — Error-type hierarchy test (write first, ensure FAIL before T020)
 *
 * Validates the AppError class hierarchy per contracts/error-types.md §"The hierarchy".
 */

import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthError,
  ValidationError,
  ServerError,
  NetworkError,
  AbortError,
  UnknownError,
} from "@/shared/api/errors";

describe("shared/api/errors — error hierarchy", () => {
  it("AuthError extends AppError", () => {
    const err = new AuthError("Unauthorized", { status: 401 });
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.kind).toBe("auth");
    expect(err.status).toBe(401);
  });

  it("ValidationError extends AppError", () => {
    const err = new ValidationError("Bad request", { status: 400 });
    expect(err).toBeInstanceOf(AppError);
    expect(err.kind).toBe("validation");
  });

  it("ServerError extends AppError", () => {
    const err = new ServerError("Server error", { status: 500 });
    expect(err).toBeInstanceOf(AppError);
    expect(err.kind).toBe("server");
  });

  it("NetworkError extends AppError", () => {
    const err = new NetworkError("Network failure");
    expect(err).toBeInstanceOf(AppError);
    expect(err.kind).toBe("network");
    expect(err.status).toBeNull();
  });

  it("AbortError extends AppError", () => {
    const err = new AbortError("Aborted");
    expect(err).toBeInstanceOf(AppError);
    expect(err.kind).toBe("abort");
    expect(err.status).toBeNull();
  });

  it("UnknownError extends AppError", () => {
    const err = new UnknownError("Unknown");
    expect(err).toBeInstanceOf(AppError);
    expect(err.kind).toBe("unknown");
  });

  it("toUserMessage() returns documented default messages", () => {
    expect(new AuthError("msg", { status: 401 }).toUserMessage()).toMatch(
      /session|sign in/i,
    );
    expect(new AuthError("msg", { status: 403 }).toUserMessage()).toMatch(
      /permission/i,
    );
    expect(new ValidationError("msg", { status: 400 }).toUserMessage()).toMatch(
      /valid/i,
    );
    expect(new ServerError("msg", { status: 500 }).toUserMessage()).toMatch(
      /something went wrong/i,
    );
    expect(new NetworkError("msg").toUserMessage()).toMatch(/offline/i);
    expect(new AbortError("msg").toUserMessage()).toMatch(/cancel/i);
  });

  it("toLogEntry() returns the structured log shape", () => {
    const err = new AuthError("Unauthorized", {
      status: 401,
      details: { token: "expired" },
    });
    const log = err.toLogEntry();
    expect(log).toMatchObject({
      kind: "auth",
      status: 401,
      message: "Unauthorized",
    });
    expect(log).toHaveProperty("details");
    expect(log).toHaveProperty("causeMessage");
    expect(log).toHaveProperty("stack");
  });

  it("ValidationError carries Zod issues in details", () => {
    const details = { issues: [{ path: ["email"], message: "Invalid email" }] };
    const err = new ValidationError("Zod parse failure", {
      status: 422,
      details,
    });
    expect(err.details).toEqual(details);
  });
});
