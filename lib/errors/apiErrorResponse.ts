import { NextResponse } from "next/server";
import type { ApplicationError } from "@/lib/errors/application/types";
import { logApplicationError } from "@/lib/errors/logApplicationError";
import { normalizeApplicationError } from "@/lib/errors/normalizeApplicationError";

export interface ApiErrorPayload {
  error: {
    title: string;
    message: string;
  };
}

export interface ApiErrorLogContext {
  route: string;
  operation?: string;
  correlationId?: string;
}

export function createApiErrorPayload(error: ApplicationError): ApiErrorPayload {
  return {
    error: {
      title: error.title,
      message: error.userMessage,
    },
  };
}

export function createApiErrorResponse(error: ApplicationError): NextResponse {
  return NextResponse.json(createApiErrorPayload(error), {
    status: error.httpStatus,
  });
}

export function handleApiRouteError(
  error: unknown,
  context: ApiErrorLogContext,
): NextResponse {
  const applicationError = normalizeApplicationError(error);
  logApplicationError(applicationError, context);
  return createApiErrorResponse(applicationError);
}

export function parseApiErrorMessage(
  payload: { error?: string | { title?: string; message?: string } } | null | undefined,
  fallback: string,
): { title: string; message: string } {
  const error = payload?.error;

  if (typeof error === "string") {
    return {
      title: "Request could not be completed",
      message: error,
    };
  }

  if (error && typeof error === "object") {
    return {
      title: error.title ?? "Request could not be completed",
      message: error.message ?? fallback,
    };
  }

  return {
    title: "Request could not be completed",
    message: fallback,
  };
}
