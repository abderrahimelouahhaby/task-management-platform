import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/server/auth";
import { AppError, unauthorized, validationError } from "@/server/errors";

export type AuthUser = { id: string; name: string; email: string };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: AppError) {
  return NextResponse.json(
    { error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw validationError("Content-Type must be application/json.");
  }

  try {
    return await request.json();
  } catch {
    throw validationError("Request body must be valid JSON.");
  }
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return validationError(error.issues[0]?.message ?? "Invalid input.");
  }

  console.error("Unexpected error:", error);
  return new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}

type AuthedHandler<P> = (
  request: Request,
  context: { user: AuthUser; params: P },
) => Promise<Response>;

/**
 * Wraps a route handler so that it:
 * 1. requires a valid session (401 otherwise)
 * 2. gives the handler the current user and the route params
 * 3. turns any thrown error into a safe JSON response
 */
export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: AuthedHandler<P>,
) {
  return async (request: Request, context: { params: Promise<P> }): Promise<Response> => {
    try {
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session) {
        throw unauthorized();
      }

      const params = await context.params;
      const user: AuthUser = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      };

      return await handler(request, { user, params });
    } catch (error) {
      return fail(toAppError(error));
    }
  };
}
