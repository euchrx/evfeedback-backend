import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateTagInput = {
  name: string;
  type?: string | null;
  active?: boolean;
  companyId?: string;
};

type UpdateTagInput = {
  name?: string;
  type?: string | null;
  active?: boolean;
  companyId?: string;
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(companyId?: string, active?: boolean) {
    return this.prisma.tag.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(active !== undefined ? { active } : {}),
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
        _count: {
          select: {
            items: true,
          },
        },
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

    const existing = await this.prisma.tag.findFirst({
      where: {
        companyId: data.companyId,
        name: data.name.trim(),
      },
    });

    if (existing) {
      throw new BadRequestException('Já existe uma tag com esse nome nesta empresa.');
    }

    return this.prisma.tag.create({
      data: {
        name: data.name.trim(),
        type: data.type?.trim() || null,
        active: data.active ?? true,
        companyId: data.companyId,
      },
      include: {
        company: true,
        _count: {
          select: {
            items: true,
          },
        },
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

    const nextName = data.name?.trim();

    if (nextName) {
      const duplicate = await this.prisma.tag.findFirst({
        where: {
          companyId: existing.companyId,
          name: nextName,
          NOT: {
            id: existing.id,
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Já existe outra tag com esse nome nesta empresa.',
        );
      }
    }

    return this.prisma.tag.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.type !== undefined ? { type: data.type?.trim() || null } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      include: {
        company: true,
        _count: {
          select: {
            items: true,
          },
        },
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
      where: {
        id: existing.id,
      },
      data: {
        active: false,
      },
      include: {
        company: true,
        _count: {
          select: {
            items: true,
          },
        },
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
      where: {
        id: existing.id,
      },
      data: {
        active: true,
      },
      include: {
        company: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });
  }

  async hardDelete(id: string, companyId?: string) {
    const existing = await this.prisma.tag.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Tag não encontrada.');
    }

    if (existing._count.items > 0) {
      throw new BadRequestException(
        'Não é possível excluir definitivamente uma tag já vinculada a feedbacks.',
      );
    }

    return this.prisma.tag.delete({
      where: {
        id: existing.id,
      },
    });
  }
}