import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
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
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ success: false, message: "Akses khusus Superadmin." }, { status: 403 });
  }

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

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data pengguna." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ success: false, message: "Akses khusus Superadmin." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "Email sudah terdaftar." }, { status: 400 });
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

    return NextResponse.json({ success: true, message: "Pengguna berhasil dibuat.", data: newUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }
    console.error("Failed to create user:", error);
    return NextResponse.json({ success: false, message: "Gagal membuat pengguna." }, { status: 500 });
  }
}
