import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TicketStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Akses khusus Admin/Superadmin" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.CLOSED },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        actorId: session.userId,
        actorName: session.name,
        action: "CLOSED",
        note: `Tiket ditutup resmi oleh ${session.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "Tiket telah ditutup." });
  } catch (error) {
    console.error("Failed to close ticket:", error);
    return NextResponse.json({ success: false, message: "Gagal menutup tiket." }, { status: 500 });
  }
}
