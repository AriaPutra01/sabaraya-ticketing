import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().min(5, "Alasan penolakan wajib diisi minimal 5 karakter"),
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
    const validated = rejectSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        activities: {
          where: { action: "REJECTED" },
          select: { actorId: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Tiket tidak ditemukan." }, { status: 404 });
    }

    // Pastikan karyawan yang menolak memang ditugaskan tiket ini
    if (session.role === "EMPLOYEE" && ticket.assigneeId !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Anda tidak berhak menolak tiket ini." },
        { status: 403 }
      );
    }

    // Eksekusi penolakan tiket secara atomik
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
          actorId: session.userId,
          actorName: session.name,
          action: "REJECTED",
          note: `Tiket ditolak oleh ${session.name}. Alasan: ${validated.reason}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tiket berhasil ditolak. Status kembali ke PENDING menunggu penugasan admin.",
      data: {
        reassigned: false,
        status: TicketStatus.PENDING,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Input tidak valid." },
        { status: 400 }
      );
    }
    console.error("Failed to reject ticket:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses penolakan tiket." },
      { status: 500 }
    );
  }
}
