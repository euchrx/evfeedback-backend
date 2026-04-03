import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const total = await this.prisma.feedback.count();

    const average = await this.prisma.feedback.aggregate({
      _avg: { rating: true },
    });

    const ratingsRaw = await this.prisma.feedback.groupBy({
      by: ['rating'],
      _count: { rating: true },
    });

    const tagsRaw = await this.prisma.feedbackTag.groupBy({
      by: ['tagId'],
      _count: { tagId: true },
    });

    const safeRatings = Array.isArray(ratingsRaw) ? ratingsRaw : [];
    const safeTags = Array.isArray(tagsRaw) ? tagsRaw : [];

    const tagIds = safeTags.map((t) => t.tagId);

    const tagDetails = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    const ratings = safeRatings.map((r) => ({
      rating: r.rating,
      count: r._count.rating,
    }));

    const topTags = safeTags.map((t) => {
      const tag = tagDetails.find((td) => td.id === t.tagId);

      return {
        name: tag?.name || 'N/A',
        count: t._count.tagId,
      };
    });

    return {
      total,
      averageRating: average._avg.rating ?? 0,
      ratings,
      topTags,
    };
  }
}