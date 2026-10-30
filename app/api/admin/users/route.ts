import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword } from "@/lib/auth";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-response";
import { Role, Division } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  division: z.enum(["IT", "TEKNISI"]).optional().nullable(),
  phone: z.string().optional(),
  maxActiveTickets: z.number().int().min(1).default(5),
});

export async function GET() {
  const { errorResponse } = await requireAuth(["SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        division: true,
        phone: true,
        isActive: true,
        maxActiveTickets: true,
        createdAt: true,
      },
    });

    return apiSuccess(users);
  } catch (error) {
    return handleRouteError(error, "Gagal mengambil data pengguna.");
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(["SUPERADMIN"]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      return apiError("Email sudah terdaftar.", 400);
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role as Role,
        division: (data.division as Division) || null,
        phone: data.phone,
        maxActiveTickets: data.maxActiveTickets,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        division: true,
      },
    });

    return apiSuccess(newUser, "Pengguna berhasil dibuat.", 201);
  } catch (error) {
    return handleRouteError(error, "Gagal membuat pengguna.");
  }
}
