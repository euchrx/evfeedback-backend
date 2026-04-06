import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  let company = await prisma.company.findFirst({
    where: { name: "Empresa Padrão" },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Empresa Padrão",
        active: true,
      },
    });
  }

  const passwordHash = await bcrypt.hash("123456", 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@admin.com" },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        name: "Admin Global",
        email: "admin@admin.com",
        passwordHash,
        role: "SUPER_ADMIN",
        companyId: company.id,
        active: true,
      },
    });
  }

  const existingSetting = await prisma.setting.findUnique({
    where: { companyId: company.id },
  });

  if (!existingSetting) {
    await prisma.setting.create({
      data: {
        companyId: company.id,
        companyName: "Empresa Padrão",
        thankYouMessage: "Obrigado pela sua avaliação!",
        primaryColor: "#0ea5e9",
        kioskResetSeconds: 5,
      },
    });
  }

  console.log("✅ Seed concluído");
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });