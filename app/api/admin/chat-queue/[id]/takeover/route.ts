import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { triggerChatEvent } from "@/lib/pusher";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();

  const { session: user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  const session = await prisma.chatSession.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  const updatedSession = await prisma.$transaction(async (tx) => {
    const updated = await tx.chatSession.update({
      where: { id },
      data: {
        status: "AGENT_ACTIVE",
        assignedToId: user!.userId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, division: true },
        },
      },
    });

    await tx.chatMessage.create({
      data: {
        sessionId: id,
        sender: "SYSTEM",
        content: `Petugas customer service ${user!.name} (${user!.division || "CS"}) telah bergabung ke ruang percakapan.`,
      },
    });

    return updated;
  });

  await triggerChatEvent(id, "agent-joined", {
    agentName: user!.name,
    division: user!.division || "CS",
    joinedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    session: updatedSession,
  });
}
