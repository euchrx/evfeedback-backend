import { Injectable, NotFoundException } from '@nestjs/common';
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

  private buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) {
      return undefined;
    }

    const createdAt: Record<string, Date> = {};

    if (startDate) {
      createdAt.gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }

    return createdAt;
  }

  async findAll(filters: FindFeedbacksFilters) {
    const createdAt = this.buildDateRange(filters.startDate, filters.endDate);

    return this.prisma.feedback.findMany({
      where: {
        ...(filters.companyId ? { companyId: filters.companyId } : {}),
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        ...(filters.kioskId ? { kioskId: filters.kioskId } : {}),
        ...(filters.rating ? { rating: Number(filters.rating) } : {}),
        ...(createdAt ? { createdAt } : {}),
        ...(filters.active === 'true'
          ? { kiosk: { active: true } }
          : filters.active === 'false'
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
    const existing = await this.prisma.feedback.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
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
