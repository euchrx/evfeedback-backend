import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FindAllFeedbacksFilters = {
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

  async findAll(filters: FindAllFeedbacksFilters) {
    const where: any = {};

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.kioskId) {
      where.kioskId = filters.kioskId;
    }

    if (filters.rating !== undefined && filters.rating !== '') {
      const parsedRating = Number(filters.rating);

      if (!Number.isNaN(parsedRating)) {
        where.rating = parsedRating;
      }
    }

    if (filters.active !== undefined && filters.active !== '') {
      where.active = filters.active === 'true';
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};

      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return this.prisma.feedback.findMany({
      where,
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

  async findOne(id: string, companyId?: string) {
    const feedback = await this.prisma.feedback.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
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
    });

    if (!feedback) {
      throw new NotFoundException('Feedback não encontrado.');
    }

    return feedback;
  }
}