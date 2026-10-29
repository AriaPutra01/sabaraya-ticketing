import { NextResponse, connection } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await connection();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, data: null, message: "Unauthenticated" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      phone: true,
      maxActiveTickets: true,
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, data: null, message: "User not found" });
  }

  return NextResponse.json({ success: true, data: user });
}
