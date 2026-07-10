import type { ApplicationError } from "@/lib/errors/application/types";

export interface ApplicationErrorLogContext {
  route: string;
  operation?: string;
  correlationId?: string;
}

export function logApplicationError(
  error: ApplicationError,
  context: ApplicationErrorLogContext,
): void {
  const payload = {
    event: "application_error",
    route: context.route,
    operation: context.operation,
    correlationId: context.correlationId,
    errorType: error.name,
    httpStatus: error.httpStatus,
    title: error.title,
    userMessage: error.userMessage,
    diagnostics: error.diagnostics,
    timestamp: new Date().toISOString(),
  };

  if (error.httpStatus >= 500) {
    console.error(JSON.stringify(payload));
    return;
  }

  console.warn(JSON.stringify(payload));
}
