import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiosksService } from '../kiosks/kiosks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private kiosksService: KiosksService,
  ) { }

  async getKioskConfig(token: string) {
    const kiosk = await this.kiosksService.findByToken(token);

    if (!kiosk) {
      throw new NotFoundException('Kiosk inválido');
    }

    if (kiosk.active === false) {
      throw new ForbiddenException('Kiosk inativo');
    }

    const setting = await this.prisma.setting.findUnique({
      where: {
        companyId: kiosk.companyId,
      },
    });

    return {
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        active: kiosk.active,
      },
      company: {
        id: kiosk.company.id,
        name: setting?.companyName || kiosk.company.name,
        logoUrl: setting?.logoUrl || null,
        thankYouMessage:
          setting?.thankYouMessage || 'Obrigado pela sua avaliação!',
        primaryColor: setting?.primaryColor || '#0ea5e9',
        kioskResetSeconds: setting?.kioskResetSeconds ?? 5,
        heroTitle: setting?.heroTitle || 'Como foi sua experiência hoje?',
        heroSubtitle:
          setting?.heroSubtitle || 'Toque em uma opção para avaliar rapidamente.',
        backgroundColor: setting?.backgroundColor || '#020617',
        backgroundImageUrl: setting?.backgroundImageUrl || null,
        cardBackgroundColor: setting?.cardBackgroundColor || 'rgba(15,23,42,0.72)',
        textColor: setting?.textColor || '#ffffff',
        buttonTextColor: setting?.buttonTextColor || '#0f172a',
      },
    };
  }

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
        companyId: kiosk.companyId,
      },
    });

    if (Array.isArray(dto.tagIds) && dto.tagIds.length > 0) {
      const validTags = await this.prisma.tag.findMany({
        where: {
          id: {
            in: dto.tagIds,
          },
          companyId: kiosk.companyId,
          active: true,
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

  async getKioskTags(token: string) {
    const kiosk = await this.kiosksService.findByToken(token);

    if (!kiosk) {
      throw new NotFoundException('Kiosk inválido');
    }

    if (kiosk.active === false) {
      throw new ForbiddenException('Kiosk inativo');
    }

    return this.prisma.tag.findMany({
      where: {
        companyId: kiosk.companyId,
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
}