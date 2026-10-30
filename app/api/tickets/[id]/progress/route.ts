import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { TicketStatus } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return apiError("Tiket tidak ditemukan.", 404);
    }

    if (session!.role === "EMPLOYEE" && ticket.assigneeId !== session!.userId) {
      return apiError("Akses ditolak: Tiket bukan ditugaskan kepada Anda.", 403);
    }

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.IN_PROGRESS,
          respondedAt: ticket.respondedAt || new Date(),
        },
      }),
      prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: session!.userId,
          actorName: session!.name,
          action: "IN_PROGRESS",
          note: `Tugas diterima dan disetujui oleh ${session!.name} (Memulai Penanganan)`,
        },
      }),
    ]);

    return apiSuccess(undefined, "Tugas berhasil disetujui & mulai dikerjakan.");
  } catch (error) {
    return handleRouteError(error, "Gagal memperbarui status tiket.");
  }
}
