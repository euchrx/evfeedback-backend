import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingCompany = await prisma.company.findFirst();

  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: {
        in: [UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN],
      },
    },
  });

  if (existingCompany && existingAdmin) {
    console.log('✅ Seed ignorado: já existe empresa e usuário admin cadastrados.');
    return;
  }

  let company = existingCompany;

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Empresa Padrão',
        active: true,
      },
    });

    console.log('🏢 Empresa padrão criada.');
  }

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('123456', 10);

    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@evfeedback.com',
        password: passwordHash,
        role: UserRole.SUPER_ADMIN,
        active: true,
        companyId: company.id,
      },
    });

    console.log('👤 Usuário admin padrão criado.');
  }

  console.log('✅ Seed concluído.');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });