import { NextResponse } from "next/server";
import type { FieldErrors } from "@/lib/errors/domain.errors";
import type { PaginationMeta } from "@/lib/pagination";
import type { ApiErrorBody, ApiSuccessBody } from "./envelope";

function success<T>(data: T, status = 200): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

function created<T>(data: T): NextResponse<ApiSuccessBody<T>> {
  return success(data, 201);
}

function paginated<T>(data: T[], pagination: PaginationMeta): NextResponse<ApiSuccessBody<T[]>> {
  return NextResponse.json({ ok: true, data, pagination });
}

function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

function error(message: string, status: number, fieldErrors?: FieldErrors): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = fieldErrors ? { ok: false, error: message, fieldErrors } : { ok: false, error: message };
  return NextResponse.json(body, { status });
}

export const ApiResponse = { success, created, paginated, noContent, error };
