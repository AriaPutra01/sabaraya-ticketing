import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial production-ready data...");

  const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Akun Awal Superadmin
  const superadminEmail = (process.env.ADMIN_EMAIL || "superadmin@sabaraya.id").toLowerCase();
  await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {},
    create: {
      name: "Super Administrator",
      email: superadminEmail,
      passwordHash,
      role: Role.SUPERADMIN,
      phone: "081234567890",
      isActive: true,
    },
  });
  console.log(`✓ Superadmin akun siap: ${superadminEmail}`);

  // 2. Master Wilayah Awal (Bandung & Sekitarnya, Cirebon & Sekitarnya)
  const initialRegions = [
    {
      name: "Bandung & Sekitarnya",
      coverage: "Kota Bandung, Kota Cimahi, Kab. Bandung, Kab. Bandung Barat, Kab. Sumedang",
    },
    {
      name: "Cirebon & Sekitarnya",
      coverage: "Kota Cirebon, Kab. Cirebon, Kab. Indramayu, Kab. Majalengka, Kab. Kuningan",
    },
  ];

  for (const reg of initialRegions) {
    await prisma.region.upsert({
      where: { name: reg.name },
      update: { coverage: reg.coverage },
      create: {
        name: reg.name,
        coverage: reg.coverage,
        isActive: true,
      },
    });
    console.log(`✓ Wilayah aktif: ${reg.name}`);
  }

  console.log("Seeding selesai dengan bersih.");
}

main()
  .catch((e) => {
    console.error("Gagal menjalankan seeder:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
