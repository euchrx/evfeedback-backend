import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskDto } from './dto/update-kiosk.dto';

@Injectable()
export class KiosksService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(companyId?: string) {
    return this.prisma.kiosk.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: true,
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId?: string) {
    const kiosk = await this.prisma.kiosk.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
        branch: true,
      },
    });

    if (!kiosk) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    return kiosk;
  }

  async create(companyId: string | undefined, data: CreateKioskDto) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    if (!data.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    if (!data.branchId) {
      throw new BadRequestException('Filial é obrigatória.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: data.branchId,
        companyId,
      },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException('Filial não encontrada para a empresa informada.');
    }

    return this.prisma.kiosk.create({
      data: {
        name: data.name.trim(),
        locationDescription: data.locationDescription?.trim() || null,
        token: randomUUID(),
        active: data.active ?? true,
        companyId,
        branchId: data.branchId,
      },
      include: {
        company: true,
        branch: true,
      },
    });
  }

  async update(id: string, companyId: string | undefined, data: UpdateKioskDto) {
    const existing = await this.prisma.kiosk.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
        branch: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    const targetCompanyId = data.companyId ?? existing.companyId;
    const targetBranchId = data.branchId ?? existing.branchId;

    if (!targetCompanyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    if (targetBranchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: targetBranchId,
          companyId: targetCompanyId,
        },
        select: { id: true },
      });

      if (!branch) {
        throw new NotFoundException('Filial não encontrada para a empresa informada.');
      }
    }

    return this.prisma.kiosk.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.locationDescription !== undefined
          ? { locationDescription: data.locationDescription.trim() || null }
          : {}),
        ...(data.branchId !== undefined ? { branchId: data.branchId } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.companyId !== undefined ? { companyId: targetCompanyId } : {}),
      },
      include: {
        company: true,
        branch: true,
      },
    });
  }

  async deactivate(id: string, companyId?: string) {
    const existing = await this.prisma.kiosk.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    return this.prisma.kiosk.update({
      where: { id: existing.id },
      data: { active: false },
      include: {
        company: true,
        branch: true,
      },
    });
  }

  async activate(id: string, companyId?: string) {
    const existing = await this.prisma.kiosk.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    return this.prisma.kiosk.update({
      where: { id: existing.id },
      data: { active: true },
      include: {
        company: true,
        branch: true,
      },
    });
  }

  async regenerateToken(id: string, companyId?: string) {
    const existing = await this.prisma.kiosk.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    return this.prisma.kiosk.update({
      where: { id: existing.id },
      data: {
        token: randomUUID(),
      },
      include: {
        company: true,
        branch: true,
      },
    });
  }

  async hardDelete(id: string, companyId?: string) {
    const existing = await this.prisma.kiosk.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    return this.prisma.kiosk.delete({
      where: { id: existing.id },
    });
  }

  async findByToken(token: string) {
    return this.prisma.kiosk.findFirst({
      where: {
        token,
      },
      include: {
        company: true,
        branch: true,
      },
    });
  }
}