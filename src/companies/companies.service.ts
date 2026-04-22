import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeId(id: string) {
    const normalizedId = id?.trim();

    if (!normalizedId) {
      throw new BadRequestException('id é obrigatório.');
    }

    return normalizedId;
  }

  private normalizeName(name?: string) {
    const normalizedName = name?.trim();

    if (!normalizedName) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    return normalizedName;
  }

  async create(data: CreateCompanyDto) {
    const normalizedName = this.normalizeName(data.name);

    return this.prisma.company.create({
      data: {
        name: normalizedName,
      },
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const normalizedId = this.normalizeId(id);

    const company = await this.prisma.company.findUnique({
      where: { id: normalizedId },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return company;
  }

  async update(id: string, data: UpdateCompanyDto) {
    const normalizedId = this.normalizeId(id);
    await this.ensureExists(normalizedId);

    const updateData: {
      name?: string;
      active?: boolean;
    } = {};

    if (data.name !== undefined) {
      updateData.name = this.normalizeName(data.name);
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    return this.prisma.company.update({
      where: { id: normalizedId },
      data: updateData,
    });
  }

  async deactivate(id: string) {
    const normalizedId = this.normalizeId(id);
    await this.ensureExists(normalizedId);

    return this.prisma.company.update({
      where: { id: normalizedId },
      data: {
        active: false,
      },
    });
  }

  async activate(id: string) {
    const normalizedId = this.normalizeId(id);
    await this.ensureExists(normalizedId);

    return this.prisma.company.update({
      where: { id: normalizedId },
      data: {
        active: true,
      },
    });
  }

  async hardDelete(id: string) {
    const normalizedId = this.normalizeId(id);
    await this.ensureExists(normalizedId);

    return this.prisma.company.delete({
      where: { id: normalizedId },
    });
  }

  private async ensureExists(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return company;
  }
}