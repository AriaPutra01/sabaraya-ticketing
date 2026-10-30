import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.coverage) updateData.coverage = body.coverage;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updated = await prisma.region.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess(updated, "Daerah berhasil diperbarui.");
  } catch (error) {
    return handleRouteError(error, "Gagal memperbarui daerah.");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const ticketCount = await prisma.ticket.count({
      where: { regionId: id },
    });

    if (ticketCount > 0) {
      return apiError(
        `Daerah ini memiliki ${ticketCount} riwayat tiket. Gunakan opsi 'Nonaktifkan' untuk menghentikan penugasan baru tanpa merusak data tiket.`,
        400
      );
    }

    await prisma.region.delete({
      where: { id },
    });

    return apiSuccess(undefined, "Daerah berhasil dihapus permanen.");
  } catch (error) {
    return handleRouteError(error, "Gagal menghapus daerah.");
  }
}
