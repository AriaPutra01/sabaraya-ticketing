import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api-response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    await prisma.employeeSchedule.delete({ where: { id } });
    return apiSuccess(undefined, "Jadwal berhasil dihapus.");
  } catch (error) {
    return handleRouteError(error, "Gagal menghapus jadwal.");
  }
}
