import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { assignTicketRoundRobin } from "@/lib/round-robin";
import { TicketStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const minutes = Number(searchParams.get("minutes") || 30);
    const forceAll = searchParams.get("force") === "true";

    const thresholdTime = new Date(Date.now() - minutes * 60 * 1000);

    const whereClause: any = {
      status: TicketStatus.PENDING,
    };

    if (!forceAll) {
      whereClause.createdAt = { lte: thresholdTime };
    }

    const pendingTickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        activities: {
          where: { action: "REJECTED" },
          select: { actorId: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pendingTickets.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: forceAll
          ? "Tidak ada tiket berstatus PENDING saat ini."
          : `Tidak ada tiket PENDING yang terabaikan lebih dari ${minutes} menit.`,
      });
    }

    let assignedCount = 0;
    const details = [];

    for (const ticket of pendingTickets) {
      const rejectedUserIds = ticket.activities
        .map((a) => a.actorId)
        .filter(Boolean) as string[];

      const result = await assignTicketRoundRobin(
        ticket.id,
        ticket.division,
        ticket.regionId,
        rejectedUserIds
      );

      if (result.assigned) {
        assignedCount++;
        details.push({
          code: ticket.code,
          assignedTo: result.assignee?.name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: assignedCount,
      totalPending: pendingTickets.length,
      message: `Berhasil menugaskan otomatis ${assignedCount} dari ${pendingTickets.length} tiket pending.`,
      details,
    });
  } catch (error) {
    console.error("Auto assign error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menjalankan auto-assign tiket." },
      { status: 500 }
    );
  }
}
