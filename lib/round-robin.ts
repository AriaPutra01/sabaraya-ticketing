import { prisma } from "./prisma";
import { Division, TicketStatus, User } from "@prisma/client";

interface AssignmentResult {
  assigned: boolean;
  assignee?: User;
  reason?: string;
}

/**
 * Temukan karyawan terbaik untuk tiket berdasarkan divisi, daerah, dan jadwal aktif.
 * Menggunakan prinsip least-active tickets (beban kerja terendah) di database PostgreSQL.
 */
export async function assignTicketRoundRobin(
  ticketId: string,
  division: Division,
  regionId: string,
  excludeUserIds: string[] = []
): Promise<AssignmentResult> {
  const now = new Date();

  // 1. Ambil semua karyawan aktif di divisi yang bersangkutan dan memiliki jadwal siaga aktif di daerah ini
  const eligibleSchedules = await prisma.employeeSchedule.findMany({
    where: {
      regionId,
      startTime: { lte: now },
      endTime: { gte: now },
      user: {
        role: "EMPLOYEE",
        division,
        isActive: true,
        id: { notIn: excludeUserIds },
      },
    },
    include: {
      user: {
        include: {
          assignedTickets: {
            where: {
              status: {
                in: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS],
              },
            },
            select: { id: true },
          },
        },
      },
    },
  });

  if (eligibleSchedules.length === 0) {
    return {
      assigned: false,
      reason: "Tidak ada karyawan dengan jadwal siaga aktif di daerah dan divisi ini.",
    };
  }

  // 2. Filter karyawan unik (jika ada overlap jadwal)
  const candidateMap = new Map<string, typeof eligibleSchedules[0]["user"]>();
  for (const s of eligibleSchedules) {
    candidateMap.set(s.user.id, s.user);
  }
  const candidates = Array.from(candidateMap.values());

  // 3. Urutkan berdasarkan beban kerja aktif (least active tickets)
  candidates.sort((a, b) => {
    const loadA = a.assignedTickets.length;
    const loadB = b.assignedTickets.length;
    if (loadA !== loadB) return loadA - loadB;
    return a.name.localeCompare(b.name);
  });

  // Ambil kandidat dengan beban terendah yang belum melebihi maxActiveTickets
  const validCandidate = candidates.find(
    (c) => c.assignedTickets.length < c.maxActiveTickets
  );

  if (!validCandidate) {
    return {
      assigned: false,
      reason: "Semua karyawan terjadwal telah mencapai kapasitas maksimal tiket aktif.",
    };
  }

  // 4. Update Tiket dengan Assignee dalam transaksi atomik
  const success = await prisma.$transaction(async (tx) => {
    const currentTicket = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true },
    });

    if (!currentTicket || currentTicket.status !== TicketStatus.PENDING) {
      return false;
    }

    await tx.ticket.update({
      where: { id: ticketId },
      data: {
        assigneeId: validCandidate.id,
        status: TicketStatus.ASSIGNED,
        assignedAt: now,
      },
    });

    await tx.ticketActivity.create({
      data: {
        ticketId,
        actorName: "Sistem Round-Robin",
        action: "ASSIGNED",
        note: `Ditugaskan otomatis ke ${validCandidate.name} (Jadwal Siaga Aktif)`,
      },
    });

    return true;
  });

  if (!success) {
    return {
      assigned: false,
      reason: "Tiket sudah tidak dalam status PENDING atau sudah ditugaskan sebelumnya.",
    };
  }

  return {
    assigned: true,
    assignee: validCandidate,
  };
}

export interface AutoAssignOptions {
  minutes?: number;
  forceAll?: boolean;
}

export interface AutoAssignSummary {
  totalPending: number;
  assignedCount: number;
  message: string;
  details: Array<{
    ticketId: string;
    code: string;
    assigned: boolean;
    assigneeName?: string;
    reason?: string;
  }>;
}

/**
 * Memeriksa dan menugaskan tiket PENDING yang terabaikan secara otomatis
 * Dipakai bersama oleh route admin dan route Vercel Cron.
 */
export async function autoAssignPendingTickets(
  options: AutoAssignOptions = {}
): Promise<AutoAssignSummary> {
  const { minutes = 30, forceAll = false } = options;
  const thresholdTime = new Date(Date.now() - minutes * 60 * 1000);

  const whereClause: any = {
    status: TicketStatus.PENDING,
  };
  if (!forceAll) {
    whereClause.createdAt = { lte: thresholdTime };
  }

  const pendingTickets = await prisma.ticket.findMany({
    where: whereClause,
    include: {
      activities: {
        where: { action: "REJECTED" },
        select: { actorId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pendingTickets.length === 0) {
    return {
      totalPending: 0,
      assignedCount: 0,
      message: forceAll
        ? "Tidak ada tiket berstatus PENDING saat ini."
        : `Tidak ada tiket PENDING yang terabaikan lebih dari ${minutes} menit.`,
      details: [],
    };
  }

  let assignedCount = 0;
  const details: AutoAssignSummary["details"] = [];

  for (const ticket of pendingTickets) {
    const rejectedUserIds = ticket.activities
      .map((a) => a.actorId)
      .filter(Boolean) as string[];

    const result = await assignTicketRoundRobin(
      ticket.id,
      ticket.division,
      ticket.regionId,
      rejectedUserIds
    );

    if (result.assigned) {
      assignedCount++;
      details.push({
        ticketId: ticket.id,
        code: ticket.code,
        assigned: true,
        assigneeName: result.assignee?.name,
      });
    } else {
      details.push({
        ticketId: ticket.id,
        code: ticket.code,
        assigned: false,
        reason: result.reason,
      });
    }
  }

  return {
    totalPending: pendingTickets.length,
    assignedCount,
    message: `Berhasil menugaskan ${assignedCount} dari ${pendingTickets.length} tiket pending.`,
    details,
  };
}
