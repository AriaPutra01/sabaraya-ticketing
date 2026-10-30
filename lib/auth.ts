import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import crypto from "crypto";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || "sabaraya-access-secret-key-default-32chars"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "sabaraya-refresh-secret-key-default-32chars"
);

export interface TokenPayload {
  userId: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "EMPLOYEE";
  division?: "IT" | "TEKNISI" | null;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const normalizedHash = hash.startsWith("$2y$") ? "$2a$" + hash.slice(4) : hash;
  return bcrypt.compare(password, normalizedHash);
}

export async function createTokens(user: {
  id: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "EMPLOYEE";
  division?: "IT" | "TEKNISI" | null;
  name: string;
}) {
  const tokenId = crypto.randomUUID();

  // 15 Menit Access Token
  const accessToken = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    division: user.division,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET);

  // 7 Hari Refresh Token
  const refreshToken = await new SignJWT({
    userId: user.id,
    tokenId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(REFRESH_SECRET);

  // Simpan Refresh Token ke tabel PostgreSQL 'sessions' (Vercel Serverless Ready)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (prisma?.session) {
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });
  }

  return { accessToken, refreshToken, tokenId };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    await jwtVerify(token, REFRESH_SECRET);

    // Cek di database PostgreSQL
    if (!prisma?.session) return null;
    const session = await prisma.session.findFirst({
      where: {
        refreshToken: token,
        expiresAt: { gt: new Date() },
      },
      select: { userId: true },
    });

    if (!session) return null;

    return { userId: session.userId };
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(token: string) {
  try {
    if (prisma?.session) {
      await prisma.session.deleteMany({
        where: { refreshToken: token },
      });
    }
  } catch (err) {
    console.error("Gagal menghapus session dari database:", err);
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sbr_access_token")?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) return payload;
  }

  // Jika access token kedaluwarsa, gunakan refresh token dari database
  const refreshToken = cookieStore.get("sbr_refresh_token")?.value;
  if (!refreshToken) return null;

  const refreshData = await verifyRefreshToken(refreshToken);
  if (!refreshData) return null;

  const user = await prisma.user.findUnique({
    where: { id: refreshData.userId },
  });

  if (!user || !user.isActive) return null;

  // Hapus refresh token lama dan buat token baru (rotasi token)
  await revokeRefreshToken(refreshToken);
  const newTokens = await createTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    division: user.division,
    name: user.name,
  });

  try {
    cookieStore.set("sbr_access_token", newTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    cookieStore.set("sbr_refresh_token", newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch {
    // Abaikan jika dipanggil dari konteks read-only (misal Server Component)
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    division: user.division,
    name: user.name,
  };
}

export async function requireAuth(
  allowedRoles?: Array<"SUPERADMIN" | "ADMIN" | "EMPLOYEE">
): Promise<{
  session: TokenPayload | null;
  errorResponse: NextResponse | null;
}> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { success: false, message: "Unauthorized: Silakan login terlebih dahulu." },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { success: false, message: "Akses ditolak: Anda tidak memiliki izin untuk tindakan ini." },
        { status: 403 }
      ),
    };
  }

  return { session, errorResponse: null };
}
