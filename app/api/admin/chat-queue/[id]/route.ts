import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { triggerChatEvent } from "@/lib/pusher";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();

  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya Admin yang dapat menghapus sesi" }, { status: 403 });
  }

  const { id } = await params;

  const session = await prisma.chatSession.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.deleteMany({
      where: { sessionId: id },
    });
    await tx.chatSession.delete({
      where: { id },
    });
  });

  await triggerChatEvent(`chat-${id}`, "session-deleted", { sessionId: id });

  return NextResponse.json({ success: true, message: "Sesi chat berhasil dihapus" });
}
