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

  // 4. Update Tiket dengan Assignee
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assigneeId: validCandidate.id,
      status: TicketStatus.ASSIGNED,
      assignedAt: now,
    },
  });

  // 5. Catat Aktivitas Penugasan
  await prisma.ticketActivity.create({
    data: {
      ticketId,
      actorName: "Sistem Round-Robin",
      action: "ASSIGNED",
      note: `Ditugaskan otomatis ke ${validCandidate.name} (Jadwal Siaga Aktif)`,
    },
  });

  return {
    assigned: true,
    assignee: validCandidate,
  };
}
