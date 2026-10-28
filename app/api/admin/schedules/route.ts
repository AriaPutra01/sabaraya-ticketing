import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createScheduleSchema = z.object({
  userId: z.string().min(1, "Karyawan wajib dipilih"),
  regionId: z.string().min(1, "Daerah wajib dipilih"),
  startTime: z.string().min(1, "Waktu mulai wajib diisi"),
  endTime: z.string().min(1, "Waktu selesai wajib diisi"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const regionId = searchParams.get("regionId");
  const userId = searchParams.get("userId");

  const where: any = {};
  if (regionId && regionId !== "ALL") where.regionId = regionId;
  if (userId && userId !== "ALL") where.userId = userId;

  try {
    const schedules = await prisma.employeeSchedule.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, division: true, phone: true } },
        region: { select: { id: true, name: true, coverage: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data jadwal." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createScheduleSchema.parse(body);

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      return NextResponse.json({ success: false, message: "Waktu selesai harus lebih besar dari waktu mulai." }, { status: 400 });
    }

    const schedule = await prisma.employeeSchedule.create({
      data: {
        userId: data.userId,
        regionId: data.regionId,
        startTime: start,
        endTime: end,
        notes: data.notes,
      },
      include: {
        user: { select: { name: true, division: true } },
        region: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, message: "Jadwal berhasil ditambahkan.", data: schedule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }
    console.error("Failed to create schedule:", error);
    return NextResponse.json({ success: false, message: "Gagal menambahkan jadwal." }, { status: 500 });
  }
}
