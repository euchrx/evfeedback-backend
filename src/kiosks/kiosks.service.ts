import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskDto } from './dto/update-kiosk.dto';

@Injectable()
export class KiosksService {
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

  private async ensureBranchExistsForCompany(
    branchId: string,
    companyId: string,
  ) {
    const normalizedBranchId = branchId.trim();

    if (!normalizedBranchId) {
      throw new BadRequestException('Filial é obrigatória.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: normalizedBranchId,
        companyId,
      },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException(
        'Filial não encontrada para a empresa informada.',
      );
    }

    return normalizedBranchId;
  }

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
    if (!companyId?.trim()) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedName = data.name?.trim();
    if (!normalizedName) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    const normalizedCompanyId = await this.ensureCompanyExists(companyId);
    const normalizedBranchId = await this.ensureBranchExistsForCompany(
      data.branchId,
      normalizedCompanyId,
    );

    return this.prisma.kiosk.create({
      data: {
        name: normalizedName,
        locationDescription: data.locationDescription?.trim() || null,
        token: randomUUID(),
        active: data.active ?? true,
        companyId: normalizedCompanyId,
        branchId: normalizedBranchId,
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
    data: UpdateKioskDto,
  ) {
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

    const targetCompanyId = (data.companyId?.trim() || existing.companyId).trim();
    const targetBranchId = (data.branchId?.trim() || existing.branchId).trim();

    if (!targetCompanyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    if (!targetBranchId) {
      throw new BadRequestException('Filial é obrigatória.');
    }

    await this.ensureCompanyExists(targetCompanyId);
    await this.ensureBranchExistsForCompany(targetBranchId, targetCompanyId);

    if (data.name !== undefined && !data.name.trim()) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    return this.prisma.kiosk.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.locationDescription !== undefined
          ? { locationDescription: data.locationDescription.trim() || null }
          : {}),
        ...(data.branchId !== undefined ? { branchId: targetBranchId } : {}),
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
    const normalizedToken = token?.trim();

    if (!normalizedToken) {
      return null;
    }

    return this.prisma.kiosk.findFirst({
      where: {
        token: normalizedToken,
      },
      include: {
        company: true,
        branch: true,
      },
    });
  }
}