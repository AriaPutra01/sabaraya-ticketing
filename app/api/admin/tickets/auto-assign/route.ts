import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { autoAssignPendingTickets } from "@/lib/round-robin";
import { apiSuccess, handleRouteError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const minutes = Number(searchParams.get("minutes") || 30);
    const forceAll = searchParams.get("force") === "true";

    const result = await autoAssignPendingTickets({ minutes, forceAll });
    return apiSuccess(result, result.message);
  } catch (error) {
    return handleRouteError(error, "Gagal menjalankan auto-assign tiket.");
  }
}
