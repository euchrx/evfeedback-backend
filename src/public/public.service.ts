import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiosksService } from '../kiosks/kiosks.service';
import { SettingsService } from '../settings/settings.service';

type CreatePublicFeedbackInput = {
  token: string;
  rating: number;
  comment?: string;
  tagIds?: string[];
  contactName?: string;
  contactPhone?: string;
  contactMessage?: string;
  contactConsent?: boolean;
};

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kiosksService: KiosksService,
    private readonly settingsService: SettingsService,
  ) {}

  async getKioskConfig(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Token do kiosk é obrigatório.');
    }

    const kiosk = await this.kiosksService.findByToken(token.trim());

    if (!kiosk || kiosk.active === false) {
      throw new NotFoundException('Kiosk não encontrado ou inativo.');
    }

    const settings = await this.prisma.setting.findUnique({
      where: {
        companyId: kiosk.companyId,
      },
    });

    return {
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        token: kiosk.token,
        branchId: kiosk.branchId,
        companyId: kiosk.companyId,
        locationDescription: kiosk.locationDescription,
      },
      company: kiosk.company
        ? {
            id: kiosk.company.id,
            name: kiosk.company.name,
          }
        : null,
      branch: kiosk.branch
        ? {
            id: kiosk.branch.id,
            name: kiosk.branch.name,
          }
        : null,
      settings,
    };
  }

  async getKioskTags(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Token do kiosk é obrigatório.');
    }

    const kiosk = await this.kiosksService.findByToken(token.trim());

    if (!kiosk || kiosk.active === false) {
      throw new NotFoundException('Kiosk não encontrado ou inativo.');
    }

    return this.prisma.tag.findMany({
      where: {
        companyId: kiosk.companyId,
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createFeedback(dto: CreatePublicFeedbackInput) {
    if (!dto?.token?.trim()) {
      throw new BadRequestException('Token do kiosk é obrigatório.');
    }

    if (!dto?.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('A nota deve estar entre 1 e 5.');
    }

    const kiosk = await this.kiosksService.findByToken(dto.token.trim());

    if (!kiosk || kiosk.active === false) {
      throw new NotFoundException('Kiosk não encontrado ou inativo.');
    }

    const validTagIds = Array.isArray(dto.tagIds)
      ? dto.tagIds.filter(Boolean)
      : [];

    if (validTagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: {
          id: { in: validTagIds },
          companyId: kiosk.companyId,
          active: true,
        },
        select: { id: true },
      });

      if (tags.length !== validTagIds.length) {
        throw new BadRequestException(
          'Uma ou mais tags informadas são inválidas para este kiosk.',
        );
      }
    }

    const contactName = dto.contactName?.trim() || null;
    const contactPhone = dto.contactPhone?.trim() || null;
    const contactMessage = dto.contactMessage?.trim() || null;
    const contactConsent = dto.contactConsent === true;

    return this.prisma.feedback.create({
      data: {
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        contactName,
        contactPhone,
        contactMessage,
        contactConsent,
        kioskId: kiosk.id,
        branchId: kiosk.branchId,
        companyId: kiosk.companyId,
        tags: validTagIds.length
          ? {
              create: validTagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        kiosk: true,
        branch: true,
        company: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async getLatestAppApk() {
    const apk = await this.settingsService.getLatestApkFile();

    if (!apk) {
      throw new NotFoundException('APK não encontrado.');
    }

    return apk;
  }
}
