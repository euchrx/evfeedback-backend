import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DashboardFilters = {
  dateFrom?: string;
  dateTo?: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeOptionalId(value?: string) {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private buildDateRange(filters?: DashboardFilters) {
    if (!filters?.dateFrom?.trim() && !filters?.dateTo?.trim()) {
      return undefined;
    }

    const createdAt: Record<string, Date> = {};

    if (filters?.dateFrom?.trim()) {
      const startDate = new Date(`${filters.dateFrom.trim()}T00:00:00-03:00`);

      if (Number.isNaN(startDate.getTime())) {
        throw new BadRequestException('dateFrom inválido.');
      }

      createdAt.gte = startDate;
    }

    if (filters?.dateTo?.trim()) {
      const endDate = new Date(`${filters.dateTo.trim()}T23:59:59.999-03:00`);

      if (Number.isNaN(endDate.getTime())) {
        throw new BadRequestException('dateTo inválido.');
      }

      createdAt.lte = endDate;
    }

    if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
      throw new BadRequestException(
        'A data inicial não pode ser maior que a data final.',
      );
    }

    return createdAt;
  }

  async getSummary(companyId?: string, filters?: DashboardFilters) {
    const normalizedCompanyId = this.normalizeOptionalId(companyId);
    const createdAt = this.buildDateRange(filters);

    const where: {
      companyId?: string;
      createdAt?: Record<string, Date>;
    } = {
      ...(normalizedCompanyId ? { companyId: normalizedCompanyId } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const total = await this.prisma.feedback.count({ where });

    const average = await this.prisma.feedback.aggregate({
      where,
      _avg: {
        rating: true,
      },
    });

    const ratingsRaw = await this.prisma.feedback.groupBy({
      by: ['rating'],
      where,
      _count: {
        rating: true,
      },
      orderBy: {
        rating: 'asc',
      },
    });

    const feedbackTags = await this.prisma.feedbackTag.findMany({
      where: {
        feedback: {
          ...(normalizedCompanyId ? { companyId: normalizedCompanyId } : {}),
          ...(createdAt ? { createdAt } : {}),
        },
      },
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
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))
      .slice(0, 5);

    const ratings = ratingsRaw.map((r) => ({
      rating: r.rating,
      count: r._count.rating,
    }));

    const recentFeedbacks = await this.prisma.feedback.findMany({
      where,
      include: {
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
      take: 10,
    });

    return {
      total,
      averageRating: Number((average._avg.rating ?? 0).toFixed(1)),
      ratings,
      topTags,
      recentFeedbacks: recentFeedbacks.map((item) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment,
        createdAt: item.createdAt,
        branchName: item.branch?.name ?? null,
        kioskName: item.kiosk?.name ?? null,
        tags: item.tags.map((tag) => tag.tag?.name).filter(Boolean),
      })),
    };
  }

  async getByBranch(companyId?: string, filters?: DashboardFilters) {
    const normalizedCompanyId = this.normalizeOptionalId(companyId);
    const createdAt = this.buildDateRange(filters);

    const branches = await this.prisma.branch.findMany({
      where: {
        ...(normalizedCompanyId ? { companyId: normalizedCompanyId } : {}),
      },
      select: {
        id: true,
        name: true,
        feedbacks: {
          where: createdAt ? { createdAt } : undefined,
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