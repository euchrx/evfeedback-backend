import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateTagInput = {
  name: string;
  color?: string;
  active?: boolean;
  companyId?: string;
};

type UpdateTagInput = {
  name?: string;
  color?: string;
  active?: boolean;
  companyId?: string;
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.tag.findMany({
      where: companyId ? { companyId } : undefined,
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
    });

    if (!tag) {
      throw new NotFoundException('Tag não encontrada.');
    }

    return tag;
  }

  async create(data: CreateTagInput) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Nome da tag é obrigatório.');
    }

    if (!data.companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    return this.prisma.tag.create({
      data: {
        name: data.name.trim(),
        color: data.color?.trim() || null,
        active: data.active ?? true,
        companyId: data.companyId,
      },
    });
  }

  async update(id: string, companyId: string | undefined, data: UpdateTagInput) {
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
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.color !== undefined ? { color: data.color?.trim() || null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
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
      data: {
        active: false,
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
      data: {
        active: true,
      },
    });
  }

  async hardDelete(id: string, companyId?: string) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Tag não encontrada.');
    }

    return this.prisma.tag.delete({
      where: { id: existing.id },
    });
  }
}