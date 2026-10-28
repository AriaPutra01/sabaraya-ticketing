import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { Role, Division } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ success: false, message: "Akses khusus Superadmin." }, { status: 403 });
  }

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

    return NextResponse.json({ success: true, message: "Pengguna berhasil diperbarui.", data: updated });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui pengguna." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ success: false, message: "Akses khusus Superadmin." }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.userId) {
    return NextResponse.json(
      { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri." },
      { status: 400 }
    );
  }

  try {
    // Cek apakah user sedang menangani tiket aktif
    const activeTickets = await prisma.ticket.count({
      where: {
        assigneeId: id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
    });

    if (activeTickets > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Pengguna sedang menangani ${activeTickets} tiket aktif. Alihkan tiket terlebih dahulu atau gunakan opsi 'Nonaktifkan'.`,
        },
        { status: 400 }
      );
    }

    // Unlink relasi dan hapus pengguna dalam transaksi atomik
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

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus permanen." });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus pengguna." }, { status: 500 });
  }
}
