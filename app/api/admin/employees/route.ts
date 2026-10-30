import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleRouteError } from "@/lib/api-response";

export async function GET() {
  const { errorResponse } = await requireAuth(["ADMIN", "SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: {
        id: true,
        name: true,
        division: true,
        email: true,
        phone: true,
        maxActiveTickets: true,
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess(employees);
  } catch (error) {
    return handleRouteError(error, "Gagal mengambil data karyawan.");
  }
}
