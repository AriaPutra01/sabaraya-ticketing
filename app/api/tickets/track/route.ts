import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (code) {
      // Cari tiket spesifik berdasarkan kode manual
      const ticket = await prisma.ticket.findUnique({
        where: { code },
        include: {
          region: { select: { name: true } },
          assignee: { select: { name: true, phone: true } },
          activities: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              actorName: true,
              action: true,
              note: true,
              createdAt: true,
            },
          },
        },
      });

      if (!ticket) {
        return NextResponse.json(
          { success: false, message: "Tiket dengan kode tersebut tidak ditemukan." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, mode: "single", data: ticket });
    }

    // Jika tidak ada parameter kode, baca otomatis riwayat tiket dari cookie sbr_tickets
    const cookieVal = req.cookies.get("sbr_tickets")?.value;
    let savedCodes: string[] = [];
    if (cookieVal) {
      try {
        savedCodes = JSON.parse(cookieVal);
      } catch {
        savedCodes = [];
      }
    }

    if (savedCodes.length === 0) {
      return NextResponse.json({ success: true, mode: "history", data: [] });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        code: { in: savedCodes },
      },
      include: {
        region: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, mode: "history", data: tickets });
  } catch (error) {
    console.error("Failed to track tickets:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses pelacakan tiket." },
      { status: 500 }
    );
  }
}
