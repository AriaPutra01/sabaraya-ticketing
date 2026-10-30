import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

const resolveSchema = z.object({
  resolutionNote: z.string().min(5, "Catatan penyelesaian wajib diisi minimal 5 karakter"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = resolveSchema.parse(body);

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
          status: TicketStatus.RESOLVED,
          resolvedAt: new Date(),
          resolutionNote: validated.resolutionNote,
        },
      }),
      prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: session!.userId,
          actorName: session!.name,
          action: "RESOLVED",
          note: `Tiket diselesaikan oleh ${session!.name}. Hasil: ${validated.resolutionNote}`,
        },
      }),
    ]);

    return apiSuccess(undefined, "Tiket berhasil diselesaikan.");
  } catch (error) {
    return handleRouteError(error, "Gagal menyelesaikan tiket.");
  }
}
