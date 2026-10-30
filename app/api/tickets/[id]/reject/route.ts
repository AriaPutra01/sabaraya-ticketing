import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().min(5, "Alasan penolakan wajib diisi minimal 5 karakter"),
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
    const validated = rejectSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return apiError("Tiket tidak ditemukan.", 404);
    }

    if (session!.role === "EMPLOYEE" && ticket.assigneeId !== session!.userId) {
      return apiError("Akses ditolak: Anda tidak berhak menolak tiket ini.", 403);
    }

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: {
          assigneeId: null,
          status: TicketStatus.PENDING,
          rejectionReason: validated.reason,
        },
      }),
      prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: session!.userId,
          actorName: session!.name,
          action: "REJECTED",
          note: `Tiket ditolak oleh ${session!.name}. Alasan: ${validated.reason}`,
        },
      }),
    ]);

    return apiSuccess(
      { reassigned: false, status: TicketStatus.PENDING },
      "Tiket berhasil ditolak. Status kembali ke PENDING menunggu penugasan."
    );
  } catch (error) {
    return handleRouteError(error, "Gagal memproses penolakan tiket.");
  }
}
