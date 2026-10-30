import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { triggerChatEvent } from "@/lib/pusher";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();

  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

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
