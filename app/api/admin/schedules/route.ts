import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { z } from "zod";

const createScheduleSchema = z.object({
  userId: z.string().min(1, "Karyawan wajib dipilih"),
  regionId: z.string().min(1, "Daerah wajib dipilih"),
  startTime: z.string().min(1, "Waktu mulai wajib diisi"),
  endTime: z.string().min(1, "Waktu selesai wajib diisi"),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

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

    return apiSuccess(schedules);
  } catch (error) {
    return handleRouteError(error, "Gagal mengambil data jadwal.");
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const data = createScheduleSchema.parse(body);

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      return apiError("Waktu selesai harus lebih besar dari waktu mulai.", 400);
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

    return apiSuccess(schedule, "Jadwal berhasil ditambahkan.", 201);
  } catch (error) {
    return handleRouteError(error, "Gagal menambahkan jadwal.");
  }
}
