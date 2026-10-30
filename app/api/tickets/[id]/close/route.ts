import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api-response";
import { TicketStatus } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.CLOSED },
      }),
      prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: session!.userId,
          actorName: session!.name,
          action: "CLOSED",
          note: `Tiket ditutup resmi oleh ${session!.name}`,
        },
      }),
    ]);

    return apiSuccess(undefined, "Tiket telah resmi ditutup.");
  } catch (error) {
    return handleRouteError(error, "Gagal menutup tiket.");
  }
}
