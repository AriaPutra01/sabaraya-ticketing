import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TicketStatus } from "@prisma/client";

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
          status: TicketStatus.IN_PROGRESS,
          respondedAt: ticket.respondedAt || new Date(),
        },
      }),
      prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: session.userId,
          actorName: session.name,
          action: "IN_PROGRESS",
          note: `Tugas diterima dan disetujui oleh ${session.name} (Memulai Penanganan)`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Tugas berhasil disetujui & mulai dikerjakan." });
  } catch (error) {
    console.error("Failed to progress ticket:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui status tiket." }, { status: 500 });
  }
}
