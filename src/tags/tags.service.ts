import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type EnvironmentType = 'POSTO' | 'CONVENIENCIA' | 'RESTAURANTE';

type CreateTagInput = {
  name: string;
  color?: string | null;
  environmentType?: EnvironmentType;
  active?: boolean;
  companyId?: string;
};

type UpdateTagInput = {
  name?: string;
  color?: string | null;
  environmentType?: EnvironmentType;
  active?: boolean;
  companyId?: string;
};

type TagTemplate = {
  name: string;
  color?: string | null;
};

type SegmentKey = 'RESTAURANTE' | 'CONVENIENCIA' | 'POSTO';

const TAG_TEMPLATES_BY_SEGMENT: Record<SegmentKey, TagTemplate[]> = {
  RESTAURANTE: [
    { name: 'Atendimento rápido', color: '#10b981' },
    { name: 'Atendimento ruim', color: '#ef4444' },
    { name: 'Comida boa', color: '#22c55e' },
    { name: 'Comida ruim', color: '#dc2626' },
    { name: 'Pedido errado', color: '#f97316' },
    { name: 'Ambiente limpo', color: '#06b6d4' },
    { name: 'Ambiente desconfortável', color: '#8b5cf6' },
    { name: 'Demora no pedido', color: '#f59e0b' },
  ],
  CONVENIENCIA: [
    { name: 'Bom atendimento', color: '#10b981' },
    { name: 'Atendimento ruim', color: '#ef4444' },
    { name: 'Loja organizada', color: '#06b6d4' },
    { name: 'Loja desorganizada', color: '#8b5cf6' },
    { name: 'Fila grande', color: '#f59e0b' },
    { name: 'Pouca variedade', color: '#f97316' },
    { name: 'Preço alto', color: '#dc2626' },
    { name: 'Loja limpa', color: '#22c55e' },
  ],
  POSTO: [
    { name: 'Bom atendimento', color: '#10b981' },
    { name: 'Atendimento ruim', color: '#ef4444' },
    { name: 'Atendimento rápido', color: '#22c55e' },
    { name: 'Demora no atendimento', color: '#f59e0b' },
    { name: 'Banheiro limpo', color: '#06b6d4' },
    { name: 'Banheiro sujo', color: '#dc2626' },
    { name: 'Pista organizada', color: '#3b82f6' },
    { name: 'Conveniência boa', color: '#8b5cf6' },
  ],
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId?: string, active?: boolean) {
    return this.prisma.tag.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(active !== undefined ? { active } : {}),
      },
      include: {
        company: true,
        _count: {
          select: {
            items: true,
          },
        },
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
        environmentType: data.environmentType ?? 'POSTO',
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Já existe uma tag com esse nome neste ambiente da empresa.',
      );
    }

    return this.prisma.tag.create({
      data: {
        name: data.name.trim(),
        color: data.color?.trim() || null,
        environmentType: data.environmentType ?? 'POSTO',
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

  async importBySegment(segment: SegmentKey, companyId?: string) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const templates = TAG_TEMPLATES_BY_SEGMENT[segment];

    if (!templates?.length) {
      throw new BadRequestException('Ambiente inválido para importação de tags.');
    }

    const existingTags = await this.prisma.tag.findMany({
      where: {
        companyId,
        environmentType: segment,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const existingNames = new Set(
      existingTags.map((tag) => tag.name.trim().toLowerCase()),
    );

    const tagsToCreate = templates.filter(
      (template) => !existingNames.has(template.name.trim().toLowerCase()),
    );

    if (tagsToCreate.length > 0) {
      await this.prisma.tag.createMany({
        data: tagsToCreate.map((template) => ({
          name: template.name,
          color: template.color ?? null,
          environmentType: segment,
          active: true,
          companyId,
        })),
      });
    }

    const allTags = await this.prisma.tag.findMany({
      where: {
        companyId,
      },
      include: {
        company: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      segment,
      createdCount: tagsToCreate.length,
      skippedCount: templates.length - tagsToCreate.length,
      tags: allTags,
    };
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
    const nextEnvironmentType = data.environmentType ?? existing.environmentType;

    if (nextName) {
      const duplicate = await this.prisma.tag.findFirst({
        where: {
          companyId: existing.companyId,
          name: nextName,
          environmentType: nextEnvironmentType,
          NOT: {
            id: existing.id,
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Já existe outra tag com esse nome neste ambiente da empresa.',
        );
      }
    }

    return this.prisma.tag.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.color !== undefined ? { color: data.color?.trim() || null } : {}),
        ...(data.environmentType !== undefined
          ? { environmentType: data.environmentType }
          : {}),
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