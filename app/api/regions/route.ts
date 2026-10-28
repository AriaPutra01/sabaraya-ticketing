import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        coverage: true,
      },
    });

    return NextResponse.json({ success: true, data: regions });
  } catch (error) {
    console.error("Failed to fetch regions:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar daerah." },
      { status: 500 }
    );
  }
}
