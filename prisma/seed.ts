import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('C733800@m', 10);

  await prisma.user.upsert({
    where: { email: 'christian@evsystem.com.br' },
    update: {
      name: 'Christian',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
      companyId: null,
    },
    create: {
      name: 'Christian',
      email: 'christian@evsystem.com.br',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
      companyId: null,
    },
  });

  console.log('Seed OK');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });