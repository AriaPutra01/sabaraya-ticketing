import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

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

    return NextResponse.json({ success: true, message: "Daerah berhasil diperbarui.", data: updated });
  } catch (error) {
    console.error("Failed to update region:", error);
    return NextResponse.json({ success: false, message: "Gagal memperbarui daerah." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const ticketCount = await prisma.ticket.count({
      where: { regionId: id },
    });

    if (ticketCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Daerah ini memiliki ${ticketCount} riwayat tiket. Gunakan opsi 'Nonaktifkan' untuk menghentikan penugasan baru tanpa merusak data tiket.`,
        },
        { status: 400 }
      );
    }

    await prisma.region.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Daerah berhasil dihapus permanen." });
  } catch (error) {
    console.error("Failed to delete region:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus daerah." }, { status: 500 });
  }
}
