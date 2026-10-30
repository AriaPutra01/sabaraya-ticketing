import { NextRequest, NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ChatSessionStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  await connection();

  const { errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const rawStatus = url.searchParams.get("status");

  let whereClause = {};
  if (rawStatus === "ALL") {
    whereClause = {};
  } else if (rawStatus && Object.values(ChatSessionStatus).includes(rawStatus as ChatSessionStatus)) {
    whereClause = { status: rawStatus as ChatSessionStatus };
  } else {
    whereClause = {
      status: {
        in: ["WAITING_FOR_AGENT", "AGENT_ACTIVE"],
      },
    };
  }

  const sessions = await prisma.chatSession.findMany({
    where: whereClause,
    include: {
      ticket: {
        select: {
          id: true,
          code: true,
          title: true,
          institutionName: true,
          status: true,
          priority: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, division: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { status: "asc" },
      { updatedAt: "desc" },
    ],
    take: 30,
  });

  return NextResponse.json({ sessions });
}
