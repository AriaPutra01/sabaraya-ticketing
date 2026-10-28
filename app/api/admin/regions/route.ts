import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createRegionSchema = z.object({
  name: z.string().min(2, "Nama daerah minimal 2 karakter"),
  coverage: z.string().min(5, "Deskripsi cakupan wilayah minimal 5 karakter"),
});

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { schedules: true, tickets: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: regions });
  } catch (error) {
    console.error("Failed to fetch regions:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data daerah." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createRegionSchema.parse(body);

    const existing = await prisma.region.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "Nama daerah sudah ada." }, { status: 400 });
    }

    const region = await prisma.region.create({
      data: {
        name: data.name,
        coverage: data.coverage,
      },
    });

    return NextResponse.json({ success: true, message: "Daerah berhasil ditambahkan.", data: region });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }
    console.error("Failed to create region:", error);
    return NextResponse.json({ success: false, message: "Gagal menambahkan daerah." }, { status: 500 });
  }
}
