import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FeedbackFilters = {
  rating?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
};

@Injectable()
export class FeedbacksService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, filters: FeedbackFilters) {
    const where: any = {
      companyId,
    };

    if (filters.rating) {
      const rating = Number(filters.rating);
      if (!Number.isNaN(rating)) {
        where.rating = rating;
      }
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};

      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }

      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    return this.prisma.feedback.findMany({
      where,
      include: {
        kiosk: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}