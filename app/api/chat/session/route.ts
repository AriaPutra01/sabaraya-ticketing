import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerChatEvent } from "@/lib/pusher";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  await connection();

  const id = req.nextUrl.searchParams.get("id");
  const token = req.nextUrl.searchParams.get("token") || req.headers.get("x-chat-token");
  if (!id && !token) {
    return NextResponse.json({ error: "ID atau token sesi diperlukan" }, { status: 400 });
  }

  const session = await prisma.chatSession.findUnique({
    where: id ? { id } : { sessionToken: token! },
    include: {
      ticket: {
        select: {
          id: true,
          code: true,
          title: true,
          institutionName: true,
          reporterName: true,
          deviceBrand: true,
          serialNumber: true,
          status: true,
          priority: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, division: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function POST(req: NextRequest) {
  await connection();

  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token || crypto.randomUUID();

    // Cek jika sesi terkait tiket tertentu
    let linkedTicketId: string | null = null;
    if (body.ticketCode) {
      const ticket = await prisma.ticket.findUnique({
        where: { code: body.ticketCode.trim().toUpperCase() },
        select: { id: true, code: true, institutionName: true },
      });
      if (ticket) {
        linkedTicketId = ticket.id;
      }
    }

    let session = await prisma.chatSession.findUnique({
      where: { sessionToken: token },
      include: {
        ticket: {
          select: {
            id: true,
            code: true,
            title: true,
            institutionName: true,
            reporterName: true,
            deviceBrand: true,
            serialNumber: true,
            status: true,
            priority: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, division: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    if (!session) {
      const messagesToCreate: Array<{ sender: "USER" | "BOT" | "SYSTEM"; content: string }> = [];

      // Salin riwayat chat ephemeral jika ada
      if (Array.isArray(body.initialMessages) && body.initialMessages.length > 0) {
        for (const m of body.initialMessages) {
          if (m && m.content) {
            messagesToCreate.push({
              sender: m.sender || (m.role === "user" ? "USER" : "BOT"),
              content: String(m.content),
            });
          }
        }
      }

      if (body.escalationReason) {
        messagesToCreate.push({
          sender: "SYSTEM",
          content: `[Eskalasi ke Staf Manusia]\nAlasan: ${body.escalationReason}\nNama Pengadu: ${body.userName || "Tamu"}\nInstansi: ${body.userContact || "-"}`,
        });
      } else if (messagesToCreate.length === 0) {
        messagesToCreate.push({
          sender: "SYSTEM",
          content: linkedTicketId
            ? `Ruang diskusi tiket resmi terhubung. Anda dapat menanyakan status tiket ini atau kendala teknis alat terkait.`
            : "Halo! Saya Sabaraya AI Assistant. Ada yang bisa saya bantu terkait layanan pengaduan tiket laboratorium atau IT rumah sakit?",
        });
      }

      const initialStatus = body.status === "WAITING_FOR_AGENT" ? "WAITING_FOR_AGENT" : "BOT_ACTIVE";

      session = await prisma.chatSession.create({
        data: {
          sessionToken: token,
          ticketId: linkedTicketId,
          userName: body.userName || null,
          userContact: body.userContact || null,
          status: initialStatus,
          messages: {
            create: messagesToCreate,
          },
        },
        include: {
          ticket: {
            select: {
              id: true,
              code: true,
              title: true,
              institutionName: true,
              reporterName: true,
              deviceBrand: true,
              serialNumber: true,
              status: true,
              priority: true,
            },
          },
          assignedTo: {
            select: { id: true, name: true, division: true },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (initialStatus === "WAITING_FOR_AGENT") {
        await triggerChatEvent("chat-queue", "new-ticket-chat", {
          sessionId: session.id,
          ticketCode: session.ticket?.code,
          userName: session.userName,
        });
      }
    } else if (linkedTicketId && !session.ticketId) {
      // Hubungkan tiket jika sesi sudah ada tapi belum diikat ke tiket
      session = await prisma.chatSession.update({
        where: { id: session.id },
        data: { ticketId: linkedTicketId },
        include: {
          ticket: {
            select: {
              id: true,
              code: true,
              title: true,
              institutionName: true,
              reporterName: true,
              deviceBrand: true,
              serialNumber: true,
              status: true,
              priority: true,
            },
          },
          assignedTo: {
            select: { id: true, name: true, division: true },
          },
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Create chat session error:", error);
    return NextResponse.json({ error: "Gagal memproses sesi chat" }, { status: 500 });
  }
}
