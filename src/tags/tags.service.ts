import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.tag.findMany({
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
    const tag = await this.prisma.tag.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag não encontrada.');
    }

    return tag;
  }

  async create(companyId: string | undefined, data: CreateTagDto) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    if (!data.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return this.prisma.tag.create({
      data: {
        name: data.name.trim(),
        color: data.color?.trim() || null,
        active: data.active ?? true,
        companyId,
      },
      include: {
        company: true,
      },
    });
  }

  async update(id: string, companyId: string | undefined, data: UpdateTagDto) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Tag não encontrada.');
    }

    const targetCompanyId = data.companyId ?? existing.companyId;

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

    return this.prisma.tag.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.color !== undefined
          ? { color: data.color.trim() || null }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.companyId !== undefined ? { companyId: targetCompanyId } : {}),
      },
      include: {
        company: true,
      },
    });
  }

  async deactivate(id: string, companyId?: string) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Tag não encontrada.');
    }

    return this.prisma.tag.update({
      where: { id: existing.id },
      data: { active: false },
      include: {
        company: true,
      },
    });
  }

  async activate(id: string, companyId?: string) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Tag não encontrada.');
    }

    return this.prisma.tag.update({
      where: { id: existing.id },
      data: { active: true },
      include: {
        company: true,
      },
    });
  }

  async hardDelete(id: string, companyId?: string) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Tag não encontrada.');
    }

    return this.prisma.tag.delete({
      where: { id: existing.id },
    });
  }
}
