import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    await prisma.employeeSchedule.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Jadwal berhasil dihapus." });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus jadwal." }, { status: 500 });
  }
}
