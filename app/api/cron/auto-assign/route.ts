import { NextRequest, NextResponse, connection } from "next/server";
import { autoAssignPendingTickets } from "@/lib/round-robin";
import { apiSuccess, handleRouteError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  await connection();

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await autoAssignPendingTickets({ minutes: 30 });
    return apiSuccess(
      {
        pendingCount: result.totalPending,
        assignedCount: result.assignedCount,
        timestamp: new Date().toISOString(),
      },
      result.message
    );
  } catch (error) {
    return handleRouteError(error, "Cron auto-assign failed.");
  }
}
