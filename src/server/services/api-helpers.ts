/**
 * API helper utilities for consistent response formatting and auth checking.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { ZodError } from "zod";

export type ApiUser = {
  id: string;
  email: string;
  name?: string | null;
};

/**
 * Require authenticated user or return 401.
 */
export async function requireApiAuth(): Promise<ApiUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return session.user as ApiUser;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function apiError(
  error: unknown,
  fallbackStatus = 500
): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".");
      if (!details[key]) details[key] = [];
      details[key].push(issue.message);
    }
    return NextResponse.json(
      { error: "Validation error", details },
      { status: 422 }
    );
  }

  console.error("[API Error]", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: fallbackStatus }
  );
}

/**
 * Wrap a route handler so any thrown error is caught and formatted.
 */
export function withErrorHandling(
  handler: (req: Request, ctx?: unknown) => Promise<NextResponse>
) {
  return async (req: Request, ctx?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return apiError(err);
    }
  };
}

/**
 * Parse pagination query params with defaults.
 */
export function parsePagination(url: URL): {
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20"))
  );
  return { page, pageSize };
}
