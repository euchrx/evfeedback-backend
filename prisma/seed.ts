import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'christian@evsystem.com.br';
  const adminName = 'Christian';
  const adminPassword = 'C733800@m';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: {
      name: adminName,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
      companyId: null,
    },
    create: {
      name: adminName,
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
      companyId: null,
    },
  });

  console.log(`Seed OK - SUPER_ADMIN garantido: ${adminEmail.toLowerCase()}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });