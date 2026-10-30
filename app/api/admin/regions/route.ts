import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { z } from "zod";

const createRegionSchema = z.object({
  name: z.string().min(2, "Nama daerah minimal 2 karakter"),
  coverage: z.string().min(5, "Deskripsi cakupan wilayah minimal 5 karakter"),
});

export async function GET() {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { schedules: true, tickets: true },
        },
      },
    });

    return apiSuccess(regions);
  } catch (error) {
    return handleRouteError(error, "Gagal mengambil data daerah.");
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const data = createRegionSchema.parse(body);

    const existing = await prisma.region.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      return apiError("Nama daerah sudah ada.", 400);
    }

    const region = await prisma.region.create({
      data: {
        name: data.name,
        coverage: data.coverage,
      },
    });

    return apiSuccess(region, "Daerah berhasil ditambahkan.", 201);
  } catch (error) {
    return handleRouteError(error, "Gagal menambahkan daerah.");
  }
}
