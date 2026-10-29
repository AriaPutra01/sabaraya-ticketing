import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { triggerChatEvent } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  await connection();

  try {
    const { sessionId, token, content } = await req.json();

    if (!sessionId || !content || !content.trim()) {
      return NextResponse.json({ error: "Session ID dan isi pesan wajib diisi" }, { status: 400 });
    }

    const staff = await getSession();

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    let sender: "USER" | "AGENT" = "USER";
    let senderId: string | null = null;

    if (staff) {
      sender = "AGENT";
      senderId = staff.userId;
    } else {
      // Validasi token pengadu
      if (token && session.sessionToken !== token) {
        return NextResponse.json({ error: "Token sesi pengadu tidak cocok" }, { status: 403 });
      }
      sender = "USER";
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender,
        senderId,
        content: content.trim(),
      },
    });

    // Broadcast ke Pusher channel
    await triggerChatEvent(`chat-${session.id}`, "new-message", {
      id: newMessage.id,
      sessionId: session.id,
      sender,
      senderId,
      senderName: staff ? staff.name : (session.userName || "Pengadu"),
      content: newMessage.content,
      createdAt: newMessage.createdAt.toISOString(),
    });

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}
