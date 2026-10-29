import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { triggerChatEvent } from "@/lib/pusher";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();

  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.chatSession.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  // Update status ke AGENT_ACTIVE dan catat pesan sistem
  const updatedSession = await prisma.$transaction(async (tx) => {
    const updated = await tx.chatSession.update({
      where: { id },
      data: {
        status: "AGENT_ACTIVE",
        assignedToId: user.userId,
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
        content: `Petugas customer service ${user.name} (${user.division || "CS"}) telah bergabung ke ruang percakapan.`,
      },
    });

    return updated;
  });

  // Notifikasi realtime ke pengadu
  await triggerChatEvent(`chat-${id}`, "agent-joined", {
    agentName: user.name,
    division: user.division,
    status: "AGENT_ACTIVE",
  });

  return NextResponse.json({ session: updatedSession });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();

  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action === "CLOSE") {
    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.chatSession.update({
        where: { id },
        data: { status: "CLOSED" },
      });
      await tx.chatMessage.create({
        data: {
          sessionId: id,
          sender: "SYSTEM",
          content: `Percakapan resmi ditutup oleh petugas ${user.name}. Terima kasih telah menghubungi Sabaraya Ticketing.`,
        },
      });
      return s;
    });

    await triggerChatEvent(`chat-${id}`, "status-changed", {
      status: "CLOSED",
    });

    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ error: "Aksi tidak didukung" }, { status: 400 });
}
