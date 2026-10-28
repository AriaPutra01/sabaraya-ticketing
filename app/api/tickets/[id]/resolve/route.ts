import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

const resolveSchema = z.object({
  resolutionNote: z.string().min(5, "Catatan penyelesaian wajib diisi minimal 5 karakter"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = resolveSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, message: "Tiket tidak ditemukan." }, { status: 404 });
    }

    if (session.role === "EMPLOYEE" && ticket.assigneeId !== session.userId) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
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
          actorId: session.userId,
          actorName: session.name,
          action: "RESOLVED",
          note: `Tiket diselesaikan oleh ${session.name}. Hasil: ${validated.resolutionNote}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Tiket berhasil diselesaikan." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }
    console.error("Failed to resolve ticket:", error);
    return NextResponse.json({ success: false, message: "Gagal menyelesaikan tiket." }, { status: 500 });
  }
}
