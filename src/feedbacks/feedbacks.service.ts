import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FindFeedbacksFilters = {
  companyId?: string;
  branchId?: string;
  kioskId?: string;
  rating?: string;
  startDate?: string;
  endDate?: string;
  active?: string;
};

@Injectable()
export class FeedbacksService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeOptionalId(value?: string) {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private parseRating(value?: string) {
    if (!value?.trim()) {
      return undefined;
    }

    const parsed = Number.parseInt(value.trim(), 10);

    if (Number.isNaN(parsed) || parsed < 1 || parsed > 5) {
      throw new BadRequestException('A nota deve estar entre 1 e 5.');
    }

    return parsed;
  }

  private parseActive(value?: string) {
    if (!value?.trim()) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new BadRequestException("active deve ser 'true' ou 'false'.");
  }

  private buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate?.trim() && !endDate?.trim()) {
      return undefined;
    }

    const createdAt: Record<string, Date> = {};

    if (startDate?.trim()) {
      const start = new Date(`${startDate.trim()}T00:00:00-03:00`);

      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException('startDate inválido.');
      }

      createdAt.gte = start;
    }

    if (endDate?.trim()) {
      const end = new Date(`${endDate.trim()}T23:59:59.999-03:00`);

      if (Number.isNaN(end.getTime())) {
        throw new BadRequestException('endDate inválido.');
      }

      createdAt.lte = end;
    }

    if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
      throw new BadRequestException(
        'A data inicial não pode ser maior que a data final.',
      );
    }

    return createdAt;
  }

  async findAll(filters: FindFeedbacksFilters) {
    const companyId = this.normalizeOptionalId(filters.companyId);
    const branchId = this.normalizeOptionalId(filters.branchId);
    const kioskId = this.normalizeOptionalId(filters.kioskId);
    const rating = this.parseRating(filters.rating);
    const active = this.parseActive(filters.active);
    const createdAt = this.buildDateRange(filters.startDate, filters.endDate);

    return this.prisma.feedback.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(branchId ? { branchId } : {}),
        ...(kioskId ? { kioskId } : {}),
        ...(rating !== undefined ? { rating } : {}),
        ...(createdAt ? { createdAt } : {}),
        ...(active === true
          ? { kiosk: { active: true } }
          : active === false
            ? { kiosk: { active: false } }
            : {}),
      },
      include: {
        company: true,
        branch: true,
        kiosk: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async hardDelete(id: string, companyId?: string) {
    const normalizedId = id?.trim();
    const normalizedCompanyId = this.normalizeOptionalId(companyId);

    if (!normalizedId) {
      throw new BadRequestException('id é obrigatório.');
    }

    const existing = await this.prisma.feedback.findFirst({
      where: {
        id: normalizedId,
        ...(normalizedCompanyId ? { companyId: normalizedCompanyId } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Feedback não encontrado.');
    }

    return this.prisma.feedback.delete({
      where: { id: existing.id },
    });
  }
}