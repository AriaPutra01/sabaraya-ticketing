import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        region: true,
        assignee: {
          select: { id: true, name: true, email: true, phone: true, division: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      return apiError("Tiket tidak ditemukan.", 404);
    }

    if (session!.role === "EMPLOYEE" && ticket.assigneeId !== session!.userId) {
      return apiError("Akses ditolak ke tiket ini.", 403);
    }

    return apiSuccess(ticket);
  } catch (error) {
    return handleRouteError(error, "Gagal mengambil detail tiket.");
  }
}
