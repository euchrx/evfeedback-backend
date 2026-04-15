import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { KiosksService } from '../kiosks/kiosks.service';
import { SettingsService } from '../settings/settings.service';

type CreatePublicFeedbackInput = {
  token: string;
  rating: number;
  comment?: string;
  email: string;
  tagIds?: string[];
  contactName?: string;
  contactPhone?: string;
  contactMessage?: string;
  contactConsent?: boolean;
};

type GetSharedFeedbacksInput = {
  token: string;
  branchId?: string;
  kioskId?: string;
  rating?: string;
  startDate?: string;
  endDate?: string;
};

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kiosksService: KiosksService,
    private readonly settingsService: SettingsService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

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

    const email = dto.email?.trim().toLowerCase() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      throw new BadRequestException('E-mail é obrigatório.');
    }

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Informe um e-mail válido.');
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
        email,
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

  async getSharedFeedbacks(input: GetSharedFeedbacksInput) {
    const rawToken = input.token?.trim();

    if (!rawToken) {
      throw new BadRequestException('Token de acesso é obrigatório.');
    }

    const tokenHash = this.hashToken(rawToken);

    const access = await this.prisma.sharedFeedbackAccess.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!access || access.active === false) {
      throw new NotFoundException('Link inválido ou desativado.');
    }

    if (access.expiresAt && access.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Este link expirou.');
    }

    const rating =
      input.rating && input.rating.trim()
        ? Number.parseInt(input.rating.trim(), 10)
        : undefined;

    if (rating !== undefined && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
      throw new BadRequestException('A nota deve estar entre 1 e 5.');
    }

    const startDate =
      input.startDate && input.startDate.trim()
        ? new Date(`${input.startDate.trim()}T00:00:00-03:00`)
        : undefined;

    const endDate =
      input.endDate && input.endDate.trim()
        ? new Date(`${input.endDate.trim()}T23:59:59.999-03:00`)
        : undefined;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('startDate inválido.');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('endDate inválido.');
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'A data inicial não pode ser maior que a data final.',
      );
    }

    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        companyId: access.companyId,
        ...(input.branchId?.trim() ? { branchId: input.branchId.trim() } : {}),
        ...(input.kioskId?.trim() ? { kioskId: input.kioskId.trim() } : {}),
        ...(rating !== undefined ? { rating } : {}),
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        kiosk: {
          select: {
            id: true,
            name: true,
            locationDescription: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    await this.prisma.sharedFeedbackAccess.update({
      where: {
        id: access.id,
      },
      data: {
        lastAccessAt: new Date(),
      },
    });

    return feedbacks;
  }

  async getLatestAppApk() {
    const apk = await this.settingsService.getLatestApkFile();

    if (!apk) {
      throw new NotFoundException('APK não encontrado.');
    }

    return apk;
  }
}