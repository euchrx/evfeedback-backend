import { Injectable, NotFoundException } from '@nestjs/common';
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

    const feedback = await this.prisma.feedback.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        kioskId: kiosk.id,
        branchId: kiosk.branchId,
      },
    });

    if (dto.tagIds?.length) {
      await this.prisma.feedbackTag.createMany({
        data: dto.tagIds.map((tagId) => ({
          feedbackId: feedback.id,
          tagId,
        })),
      });
    }

    return {
      success: true,
    };
  }
}