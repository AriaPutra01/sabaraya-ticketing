import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { Role, Division } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAuth(["SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role && ["ADMIN", "EMPLOYEE"].includes(body.role)) updateData.role = body.role as Role;
    if (body.division !== undefined) updateData.division = body.division as Division;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.maxActiveTickets !== undefined) updateData.maxActiveTickets = Number(body.maxActiveTickets);
    if (body.password && body.password.length >= 6) {
      updateData.passwordHash = await hashPassword(body.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        division: true,
        isActive: true,
      },
    });

    return apiSuccess(updated, "Pengguna berhasil diperbarui.");
  } catch (error) {
    return handleRouteError(error, "Gagal memperbarui pengguna.");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuth(["SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  if (id === session!.userId) {
    return apiError("Anda tidak dapat menghapus akun Anda sendiri.", 400);
  }

  try {
    const activeTickets = await prisma.ticket.count({
      where: {
        assigneeId: id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
    });

    if (activeTickets > 0) {
      return apiError(
        `Pengguna sedang menangani ${activeTickets} tiket aktif. Alihkan tiket terlebih dahulu atau gunakan opsi 'Nonaktifkan'.`,
        400
      );
    }

    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: null },
      }),
      prisma.ticketActivity.updateMany({
        where: { actorId: id },
        data: { actorId: null },
      }),
      prisma.user.delete({
        where: { id },
      }),
    ]);

    return apiSuccess(undefined, "Pengguna berhasil dihapus permanen.");
  } catch (error) {
    return handleRouteError(error, "Gagal menghapus pengguna.");
  }
}
