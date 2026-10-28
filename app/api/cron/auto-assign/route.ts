import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignTicketRoundRobin } from "@/lib/round-robin";
import { TicketStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  await connection();

  // Proteksi Vercel Cron via CRON_SECRET jika di-set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    // Ambang batas 30 menit default
    const thresholdTime = new Date(Date.now() - 30 * 60 * 1000);

    const pendingTickets = await prisma.ticket.findMany({
      where: {
        status: TicketStatus.PENDING,
        createdAt: { lte: thresholdTime },
      },
      include: {
        activities: {
          where: { action: "REJECTED" },
          select: { actorId: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    let assignedCount = 0;

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

      if (result.assigned) assignedCount++;
    }

    return NextResponse.json({
      success: true,
      pendingCount: pendingTickets.length,
      assignedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron auto-assign failed:", error);
    return NextResponse.json({ success: false, message: "Cron auto-assign failed." }, { status: 500 });
  }
}
