import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api-response";
import { Division, TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";

const createTicketSchema = z.object({
  division: z.enum(["IT", "TEKNISI"]),
  regionId: z.string().min(1, "Daerah wajib dipilih"),
  institutionName: z.string().min(2, "Nama instansi minimal 2 karakter"),
  reporterName: z.string().min(2, "Nama pelapor minimal 2 karakter"),
  reporterPhone: z.string().min(8, "Nomor telepon/WA minimal 8 digit"),
  reporterAddress: z.string().optional(),
  deviceBrand: z.string().optional(),
  serialNumber: z.string().optional(),
  title: z.string().min(3, "Judul keluhan minimal 3 karakter"),
  description: z.string().min(5, "Deskripsi keluhan minimal 5 karakter"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  photoUrl: z.string().optional(),
  photoUrls: z.array(z.string()).max(3, "Maksimal 3 foto").optional(),
});

export async function POST(req: NextRequest) {
  await connection();
  try {
    const body = await req.json();
    const validated = createTicketSchema.parse(body);

    const photos = validated.photoUrls || (validated.photoUrl ? [validated.photoUrl] : []);

    // Format kode tiket unik: SBY-YYMM-6DIGIT (1 juta kombinasi per bulan)
    const datePrefix = new Date().toISOString().slice(2, 7).replace("-", ""); // YYMM
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const code = `SBY-${datePrefix}-${randomSuffix}`;

    // Buat Tiket dan Aktivitas di database dalam transaksi atomik
    const ticket = await prisma.$transaction(async (tx) => {
      const createdTicket = await tx.ticket.create({
        data: {
          code,
          division: validated.division as Division,
          regionId: validated.regionId,
          institutionName: validated.institutionName,
          reporterName: validated.reporterName,
          reporterPhone: validated.reporterPhone,
          reporterAddress: validated.reporterAddress,
          deviceBrand: validated.deviceBrand,
          serialNumber: validated.serialNumber,
          title: validated.title,
          description: validated.description,
          priority: validated.priority as TicketPriority,
          photoUrl: photos[0] || null,
          photoUrls: photos,
          status: TicketStatus.PENDING,
        },
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: createdTicket.id,
          actorName: validated.reporterName,
          action: "CREATED",
          note: `Tiket diajukan oleh ${validated.reporterName} (${validated.institutionName}) - Menunggu penugasan tim operasional`,
        },
      });

      return createdTicket;
    });

    // Update cookie sbr_tickets untuk tracking otomatis pengadu
    const existingCookie = req.cookies.get("sbr_tickets")?.value;
    let ticketCodes: string[] = [];
    if (existingCookie) {
      try {
        ticketCodes = JSON.parse(existingCookie);
        if (!Array.isArray(ticketCodes)) ticketCodes = [];
      } catch {
        ticketCodes = [];
      }
    }
    if (!ticketCodes.includes(code)) {
      ticketCodes.unshift(code);
      if (ticketCodes.length > 20) ticketCodes = ticketCodes.slice(0, 20); // Simpan maks 20 tiket terakhir
    }

    const res = NextResponse.json({
      success: true,
      message: "Pengaduan berhasil didaftarkan. Menunggu penugasan petugas operasional.",
      data: {
        code: ticket.code,
        status: ticket.status,
      },
    });

    res.cookies.set("sbr_tickets", JSON.stringify(ticketCodes), {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 hari
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    return handleRouteError(error, "Terjadi kesalahan server saat membuat tiket.");
  }
}

export async function GET(req: NextRequest) {
  await connection();
  const { session, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const division = searchParams.get("division");
  const regionId = searchParams.get("regionId");
  const search = searchParams.get("search");

  const where: any = {};

  if (session!.role === "EMPLOYEE") {
    // Karyawan hanya melihat tiket yang di-assign padanya
    where.assigneeId = session!.userId;
  }

  if (status && status !== "ALL") {
    where.status = status as TicketStatus;
  }
  if (division && division !== "ALL") {
    where.division = division as Division;
  }
  if (regionId && regionId !== "ALL") {
    where.regionId = regionId;
  }
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { institutionName: { contains: search, mode: "insensitive" } },
      { reporterName: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        region: { select: { name: true, coverage: true } },
        assignee: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(tickets);
  } catch (error) {
    return handleRouteError(error, "Gagal mengambil daftar tiket.");
  }
}
