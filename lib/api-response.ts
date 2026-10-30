import { NextResponse } from "next/server";
import { z } from "zod";

export function apiSuccess<T = any>(data?: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
      ...(data !== undefined ? { data } : {}),
    },
    { status }
  );
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function handleRouteError(
  error: unknown,
  fallbackMessage = "Terjadi kesalahan internal pada server."
) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: error.issues[0]?.message || "Input data tidak valid.",
      },
      { status: 400 }
    );
  }

  console.error("Route Error:", error);
  return NextResponse.json(
    {
      success: false,
      message: fallbackMessage,
    },
    { status: 500 }
  );
}
