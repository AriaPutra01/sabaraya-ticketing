import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

const assignSchema = z.object({
  assigneeId: z.string().min(1, "ID teknisi/karyawan wajib diisi"),
});

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
    const body = await req.json();
    const { assigneeId } = assignSchema.parse(body);

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee || !assignee.isActive) {
      return NextResponse.json({ success: false, message: "Karyawan tidak valid atau nonaktif." }, { status: 400 });
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
          actorId: session.userId,
          actorName: session.name,
          action: "ASSIGNED",
          note: `Ditugaskan manual oleh ${session.name} ke ${assignee.name}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: `Tiket berhasil ditugaskan ke ${assignee.name}.` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }
    console.error("Failed to assign ticket:", error);
    return NextResponse.json({ success: false, message: "Gagal menugaskan tiket." }, { status: 500 });
  }
}
