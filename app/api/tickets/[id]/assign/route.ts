import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

const assignSchema = z.object({
  assigneeId: z.string().min(1, "ID teknisi/karyawan wajib diisi"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const { assigneeId } = assignSchema.parse(body);

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee || !assignee.isActive) {
      return apiError("Karyawan tidak valid atau nonaktif.", 400);
    }

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: {
          assigneeId,
          status: TicketStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      }),
      prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: session!.userId,
          actorName: session!.name,
          action: "ASSIGNED",
          note: `Ditugaskan manual oleh ${session!.name} ke ${assignee.name}`,
        },
      }),
    ]);

    return apiSuccess(undefined, `Tiket berhasil ditugaskan ke ${assignee.name}.`);
  } catch (error) {
    return handleRouteError(error, "Gagal menugaskan tiket.");
  }
}
