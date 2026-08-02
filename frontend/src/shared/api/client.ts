/**
 * T023 — Typed fetch wrapper.
 *
 * The single place that maps an HTTP response or a thrown `fetch` error
 * to an AppError subclass. Returns the parsed payload via Zod or throws
 * an AppError. There is no third state.
 *
 * @see contracts/error-types.md §"The fetch wrapper"
 */

import { z } from "zod";
import {
  AbortError as AppAbortError,
  NetworkError,
  ServerError,
  UnknownError,
  ValidationError,
  errorFromStatus,
} from "./errors";
import { env } from "@/shared/env";

export interface RequestConfig<S extends z.ZodTypeAny> {
  url: string;
  init?: RequestInit;
  schema: S;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function isAbortError(err: unknown): boolean {
  if (err && typeof err === "object" && "name" in err) {
    return (err as { name?: unknown }).name === "AbortError";
  }
  return false;
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) {
    return /fetch/i.test(err.message) || /network/i.test(err.message);
  }
  return false;
}

function buildUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

export async function request<S extends z.ZodTypeAny>(
  config: RequestConfig<S>
): Promise<z.infer<S>> {
  const { url, init, schema, signal, timeoutMs } = config;
  const timeout = timeoutMs ?? env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS;

  const controller = new AbortController();
  const linkedSignal = signal ?? controller.signal;

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchInit: RequestInit = {
      ...init,
      signal: linkedSignal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    };

    let response: Response;
    try {
      response = await fetch(buildUrl(url), fetchInit);
    } catch (err) {
      if (isAbortError(err) || linkedSignal.aborted) {
        throw new AppAbortError("The request was cancelled.", { cause: err as Error });
      }
      if (isNetworkError(err)) {
        throw new NetworkError("Network failure", { cause: err as Error });
      }
      throw new UnknownError("Unknown fetch failure", { cause: err as Error });
    }

    if (!response.ok) {
      let details: Record<string, unknown> | null = null;
      try {
        const text = await response.text();
        if (text) {
          try {
            details = JSON.parse(text) as Record<string, unknown>;
          } catch {
            details = { message: text };
          }
        }
      } catch {
        // body unreadable; details stay null
      }
      throw errorFromStatus(
        response.status,
        `Request failed with status ${response.status}`,
        details,
      );
    }

    if (response.status === 204) {
      clearTimeout(timer);
      return schema.parse(undefined);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (err) {
      throw new ValidationError("Response body is not valid JSON", {
        status: response.status,
        cause: err as Error,
      });
    }

    try {
      return schema.parse(json);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new ValidationError("Response body failed schema validation", {
          status: response.status,
          details: { issues: err.issues } as Record<string, unknown>,
          cause: err,
        });
      }
      throw new ServerError("Response parse failed", {
        status: response.status,
        cause: err as Error,
      });
    }
  } finally {
    clearTimeout(timer);
  }
}
