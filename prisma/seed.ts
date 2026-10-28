import { PrismaClient, Role, Division } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  // 1. Seed Superadmin
  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@sabaraya.id" },
    update: {},
    create: {
      name: "Super Administrator",
      email: "superadmin@sabaraya.id",
      passwordHash,
      role: Role.SUPERADMIN,
      phone: "081234567890",
    },
  });

  // 2. Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@sabaraya.id" },
    update: {},
    create: {
      name: "Admin Operasional",
      email: "admin@sabaraya.id",
      passwordHash,
      role: Role.ADMIN,
      phone: "081234567891",
    },
  });

  // 3. Seed Regions
  const regionsData = [
    {
      name: "Bandung Raya",
      coverage: "Kota Bandung, Kota Cimahi, Kab. Bandung, Kab. Bandung Barat, Kab. Sumedang",
    },
    {
      name: "Jabodetabek",
      coverage: "DKI Jakarta, Kota Bogor, Kab. Bogor, Kota Depok, Kota Tangerang, Tangsel, Bekasi",
    },
    {
      name: "Surabaya Raya",
      coverage: "Kota Surabaya, Kab. Sidoarjo, Kab. Gresik, Kab. Mojokerto",
    },
    {
      name: "Semarang & Sekitarnya",
      coverage: "Kota Semarang, Kab. Semarang, Kota Salatiga, Kab. Kendal, Kab. Demak",
    },
  ];

  const regions: Record<string, string> = {};
  for (const reg of regionsData) {
    const r = await prisma.region.upsert({
      where: { name: reg.name },
      update: { coverage: reg.coverage },
      create: reg,
    });
    regions[reg.name] = r.id;
  }

  // 4. Seed Employees
  const employeesData = [
    {
      name: "Ahmad Teknisi (Bandung)",
      email: "ahmad.teknisi@sabaraya.id",
      role: Role.EMPLOYEE,
      division: Division.TEKNISI,
      phone: "081211110001",
      region: "Bandung Raya",
    },
    {
      name: "Budi Teknisi (Bandung)",
      email: "budi.teknisi@sabaraya.id",
      role: Role.EMPLOYEE,
      division: Division.TEKNISI,
      phone: "081211110002",
      region: "Bandung Raya",
    },
    {
      name: "Citra IT (Bandung)",
      email: "citra.it@sabaraya.id",
      role: Role.EMPLOYEE,
      division: Division.IT,
      phone: "081211110003",
      region: "Bandung Raya",
    },
    {
      name: "Dedi Teknisi (Jabodetabek)",
      email: "dedi.teknisi@sabaraya.id",
      role: Role.EMPLOYEE,
      division: Division.TEKNISI,
      phone: "081211110004",
      region: "Jabodetabek",
    },
    {
      name: "Eka IT (Jabodetabek)",
      email: "eka.it@sabaraya.id",
      role: Role.EMPLOYEE,
      division: Division.IT,
      phone: "081211110005",
      region: "Jabodetabek",
    },
  ];

  const now = new Date();
  const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const endTime = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days ahead

  for (const emp of employeesData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        name: emp.name,
        email: emp.email,
        passwordHash,
        role: emp.role,
        division: emp.division,
        phone: emp.phone,
      },
    });

    const regionId = regions[emp.region];
    if (regionId) {
      // Upsert schedule
      const existingSchedule = await prisma.employeeSchedule.findFirst({
        where: { userId: user.id, regionId },
      });

      if (!existingSchedule) {
        await prisma.employeeSchedule.create({
          data: {
            userId: user.id,
            regionId,
            startTime,
            endTime,
            notes: `Jadwal Reguler Siaga ${emp.region}`,
          },
        });
      }
    }
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
