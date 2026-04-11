import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "Empresa Padrão" },
    update: {},
    create: {
      name: 'Empresa Padrão',
      active: true,
    },
  });

  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'christian@evsystem.com.br' },
    update: {},
    create: {
      name: 'Christian',
      email: 'christian@evsystem.com.br',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
      companyId: company.id,
    },
  });

  console.log('Seed OK');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });