import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        region: true,
        assignee: {
          select: { id: true, name: true, email: true, phone: true, division: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Tiket tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jika Employee, pastikan tiket ini ditugaskan padanya
    if (session.role === "EMPLOYEE" && ticket.assigneeId !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak ke tiket ini." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Failed to fetch ticket detail:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail tiket." },
      { status: 500 }
    );
  }
}
