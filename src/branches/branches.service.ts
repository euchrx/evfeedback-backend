import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateBranchInput = {
  name: string;
  code?: string;
  active?: boolean;
  companyId?: string;
};

type UpdateBranchInput = {
  name?: string;
  code?: string;
  active?: boolean;
  companyId?: string;
};

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCompanyExists(companyId: string) {
    const normalizedCompanyId = companyId.trim();

    if (!normalizedCompanyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: normalizedCompanyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return normalizedCompanyId;
  }

  async findAll(companyId?: string) {
    return this.prisma.branch.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId?: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Filial não encontrada.');
    }

    return branch;
  }

  async create(data: CreateBranchInput) {
    const normalizedName = data.name?.trim();

    if (!normalizedName) {
      throw new BadRequestException('Nome da filial é obrigatório.');
    }

    if (!data.companyId?.trim()) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedCompanyId = await this.ensureCompanyExists(data.companyId);

    return this.prisma.branch.create({
      data: {
        name: normalizedName,
        code: data.code?.trim() || null,
        active: data.active ?? true,
        companyId: normalizedCompanyId,
      },
      include: {
        company: true,
      },
    });
  }

  async update(
    id: string,
    companyId: string | undefined,
    data: UpdateBranchInput,
  ) {
    const existing = await this.prisma.branch.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Filial não encontrada.');
    }

    if (data.name !== undefined && !data.name.trim()) {
      throw new BadRequestException('Nome da filial é obrigatório.');
    }

    return this.prisma.branch.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.code !== undefined ? { code: data.code.trim() || null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      include: {
        company: true,
      },
    });
  }

  async deactivate(id: string, companyId?: string) {
    const existing = await this.prisma.branch.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Filial não encontrada.');
    }

    return this.prisma.branch.update({
      where: {
        id: existing.id,
      },
      data: {
        active: false,
      },
      include: {
        company: true,
      },
    });
  }

  async activate(id: string, companyId?: string) {
    const existing = await this.prisma.branch.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Filial não encontrada.');
    }

    return this.prisma.branch.update({
      where: {
        id: existing.id,
      },
      data: {
        active: true,
      },
      include: {
        company: true,
      },
    });
  }

  async hardDelete(id: string, companyId?: string) {
    const existing = await this.prisma.branch.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Filial não encontrada.');
    }

    return this.prisma.branch.delete({
      where: {
        id: existing.id,
      },
    });
  }
}