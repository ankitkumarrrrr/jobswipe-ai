import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "ankit176424@gmail.com";
  const adminPassword = "Ankit@01";

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "admin" },
    });
    console.log(`Updated ${adminEmail} to admin role`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
        subscription: {
          create: {
            plan: "PREMIUM",
            applicationsUsed: 0,
            applicationsLimit: -1,
          },
        },
        profile: {
          create: {
            skills: "[]",
          },
        },
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
