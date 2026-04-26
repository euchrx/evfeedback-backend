import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { KiosksService } from '../kiosks/kiosks.service';
import { SettingsService } from '../settings/settings.service';
import { Prisma } from '@prisma/client';

type CreatePublicFeedbackInput = {
  token: string;
  rating: number;
  comment?: string;
  email?: string;
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

  page?: string;
  pageSize?: string;

  sortBy?: 'createdAt' | 'rating';
  sortDirection?: 'asc' | 'desc';
};

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kiosksService: KiosksService,
    private readonly settingsService: SettingsService,
  ) { }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeNullableText(value?: string | null) {
    return value?.trim() || null;
  }

  private normalizeOptionalId(value?: string) {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  private parseBrazilDateRangeStart(date?: string) {
    if (!date?.trim()) {
      return undefined;
    }

    const parsed = new Date(`${date.trim()}T00:00:00-03:00`);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('startDate inválido.');
    }

    return parsed;
  }

  private parseBrazilDateRangeEnd(date?: string) {
    if (!date?.trim()) {
      return undefined;
    }

    const parsed = new Date(`${date.trim()}T23:59:59.999-03:00`);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('endDate inválido.');
    }

    return parsed;
  }

  async getKioskConfig(token: string) {
    const normalizedToken = token?.trim();

    if (!normalizedToken) {
      throw new BadRequestException('Token do kiosk é obrigatório.');
    }

    const kiosk = await this.kiosksService.findByToken(normalizedToken);

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
    const normalizedToken = token?.trim();

    if (!normalizedToken) {
      throw new BadRequestException('Token do kiosk é obrigatório.');
    }

    const kiosk = await this.kiosksService.findByToken(normalizedToken);

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
    const normalizedToken = dto?.token?.trim();

    if (!normalizedToken) {
      throw new BadRequestException('Token do kiosk é obrigatório.');
    }

    if (!Number.isInteger(dto.rating) || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('A nota deve estar entre 1 e 5.');
    }

    const email = this.normalizeNullableText(dto.email)?.toLowerCase() || null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      throw new BadRequestException('Informe um e-mail válido.');
    }

    const kiosk = await this.kiosksService.findByToken(normalizedToken);

    if (!kiosk || kiosk.active === false) {
      throw new NotFoundException('Kiosk não encontrado ou inativo.');
    }

    const validTagIds = Array.isArray(dto.tagIds)
      ? Array.from(
        new Set(
          dto.tagIds
            .map((tagId) => tagId?.trim())
            .filter((tagId): tagId is string => Boolean(tagId)),
        ),
      )
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

    const comment = this.normalizeNullableText(dto.comment);
    const contactName = this.normalizeNullableText(dto.contactName);
    const contactPhone = this.normalizeNullableText(dto.contactPhone);
    const contactMessage = this.normalizeNullableText(dto.contactMessage);
    const contactConsent = dto.contactConsent === true;

    return this.prisma.feedback.create({
      data: {
        rating: dto.rating,
        comment,
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
      where: { tokenHash },
    });

    if (!access || access.active === false) {
      throw new NotFoundException('Link inválido ou desativado.');
    }

    // 🔥 expiração automática
    if (access.expiresAt && access.expiresAt.getTime() <= Date.now()) {
      await this.prisma.sharedFeedbackAccess.update({
        where: { id: access.id },
        data: { active: false },
      });

      throw new BadRequestException('Este link expirou.');
    }

    // 🔥 paginação
    const page = Math.max(1, Number(input.page ?? 1));
    const pageSize = Math.min(Number(input.pageSize ?? 20), 100);

    // 🔥 ordenação
    const sortBy = input.sortBy === 'rating' ? 'rating' : 'createdAt';
    const sortDirection = input.sortDirection === 'asc' ? 'asc' : 'desc';

    // 🔥 filtros
    const rating =
      input.rating && input.rating.trim()
        ? Number.parseInt(input.rating.trim(), 10)
        : undefined;

    if (
      rating !== undefined &&
      (Number.isNaN(rating) || rating < 1 || rating > 5)
    ) {
      throw new BadRequestException('A nota deve estar entre 1 e 5.');
    }

    const startDate = this.parseBrazilDateRangeStart(input.startDate);
    const endDate = this.parseBrazilDateRangeEnd(input.endDate);

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'A data inicial não pode ser maior que a data final.',
      );
    }

    const branchId = this.normalizeOptionalId(input.branchId);
    const kioskId = this.normalizeOptionalId(input.kioskId);

    const where: Prisma.FeedbackWhereInput = {
      companyId: access.companyId,
      ...(branchId ? { branchId } : {}),
      ...(kioskId ? { kioskId } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(startDate || endDate
        ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
        : {}),
    };

    // 🚀 query otimizada
    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          branch: {
            select: { id: true, name: true },
          },
          kiosk: {
            select: { id: true, name: true, locationDescription: true },
          },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortDirection,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    // 🔥 atualiza último acesso
    await this.prisma.sharedFeedbackAccess.update({
      where: { id: access.id },
      data: { lastAccessAt: new Date() },
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getLatestAppApk() {
    return this.settingsService.getLatestApkFile();
  }
}