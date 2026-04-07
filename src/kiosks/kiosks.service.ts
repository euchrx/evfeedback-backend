import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

type CreateKioskInput = {
  name: string;
  branchId: string;
  companyId?: string;
  locationDescription?: string;
  active?: boolean;
};

type UpdateKioskInput = {
  name?: string;
  branchId?: string;
  companyId?: string;
  locationDescription?: string | null;
  active?: boolean;
};

@Injectable()
export class KiosksService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(data: CreateKioskInput) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Nome do kiosk é obrigatório.');
    }

    if (!data.branchId) {
      throw new BadRequestException('branchId é obrigatório.');
    }

    if (!data.companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: data.branchId,
        companyId: data.companyId,
      },
    });

    if (!branch) {
      throw new NotFoundException(
        'Filial não encontrada para a empresa informada.',
      );
    }

    return this.prisma.kiosk.create({
      data: {
        name: data.name.trim(),
        branchId: data.branchId,
        companyId: data.companyId,
        locationDescription: data.locationDescription?.trim() || null,
        active: data.active ?? true,
        token: randomUUID(),
      },
      include: {
        company: true,
        branch: true,
      },
    });
  }

  async update(
    id: string,
    companyId: string | undefined,
    data: UpdateKioskInput,
  ) {
    const existing = await this.prisma.kiosk.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    const targetCompanyId = companyId ?? existing.companyId;
    const targetBranchId = data.branchId ?? existing.branchId;

    if (data.branchId || companyId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: targetBranchId,
          companyId: targetCompanyId,
        },
      });

      if (!branch) {
        throw new NotFoundException(
          'Filial não encontrada para a empresa informada.',
        );
      }
    }

    return this.prisma.kiosk.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.branchId !== undefined ? { branchId: data.branchId } : {}),
        ...(data.locationDescription !== undefined
          ? { locationDescription: data.locationDescription?.trim() || null }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
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
      where: {
        id: existing.id,
      },
      data: {
        active: false,
      },
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
      where: {
        id: existing.id,
      },
      data: {
        active: true,
      },
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
      where: {
        id: existing.id,
      },
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
    });

    if (!existing) {
      throw new NotFoundException('Kiosk não encontrado.');
    }

    return this.prisma.kiosk.delete({
      where: {
        id: existing.id,
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.kiosk.findUnique({
      where: { token },
      include: {
        branch: true,
        company: true,
      },
    });
  }
}