import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiosksService } from '../kiosks/kiosks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private kiosksService: KiosksService,
  ) {}

  async createFeedback(dto: CreateFeedbackDto) {
    const kiosk = await this.kiosksService.findByToken(dto.token);

    if (!kiosk) {
      throw new NotFoundException('Kiosk inválido');
    }

    if (kiosk.active === false) {
      throw new ForbiddenException('Kiosk inativo');
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        kioskId: kiosk.id,
        branchId: kiosk.branchId,
      },
    });

    if (Array.isArray(dto.tagIds) && dto.tagIds.length > 0) {
      const validTags = await this.prisma.tag.findMany({
        where: {
          id: {
            in: dto.tagIds,
          },
        },
        select: {
          id: true,
        },
      });

      const validTagIds = validTags.map((tag) => tag.id);

      if (validTagIds.length > 0) {
        await this.prisma.feedbackTag.createMany({
          data: validTagIds.map((tagId) => ({
            feedbackId: feedback.id,
            tagId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return { success: true };
  }
}