import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DashboardFilters = {
  dateFrom?: string;
  dateTo?: string;
};

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private buildDateFilter(filters?: DashboardFilters) {
    if (!filters?.dateFrom && !filters?.dateTo) {
      return undefined;
    }

    const createdAt: Record<string, Date> = {};

    if (filters.dateFrom) {
      createdAt.gte = new Date(filters.dateFrom);
    }

    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      createdAt.lte = endDate;
    }

    return { createdAt };
  }

  async getSummary(filters?: DashboardFilters) {
    const where = this.buildDateFilter(filters);

    const total = await this.prisma.feedback.count({ where });

    const average = await this.prisma.feedback.aggregate({
      where,
      _avg: { rating: true },
    });

    const ratingsRaw = await this.prisma.feedback.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true },
    });

    const feedbackTags = await this.prisma.feedbackTag.findMany({
      where: where
        ? {
            feedback: where,
          }
        : undefined,
      include: {
        tag: true,
      },
    });

    const tagCounter = new Map<string, number>();

    for (const item of feedbackTags) {
      const name = item.tag?.name ?? 'N/A';
      tagCounter.set(name, (tagCounter.get(name) ?? 0) + 1);
    }

    const topTags = Array.from(tagCounter.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const ratings = (Array.isArray(ratingsRaw) ? ratingsRaw : []).map((r) => ({
      rating: r.rating,
      count: r._count.rating,
    }));

    return {
      total,
      averageRating: average._avg.rating ?? 0,
      ratings,
      topTags,
    };
  }

  async getByBranch(filters?: DashboardFilters) {
    const feedbackWhere = this.buildDateFilter(filters);

    const branches = await this.prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        feedbacks: {
          where: feedbackWhere,
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return branches.map((branch) => {
      const total = branch.feedbacks.length;

      const averageRating =
        total > 0
          ? branch.feedbacks.reduce((sum, item) => sum + item.rating, 0) / total
          : 0;

      return {
        id: branch.id,
        name: branch.name,
        totalFeedbacks: total,
        averageRating: Number(averageRating.toFixed(1)),
      };
    });
  }
}