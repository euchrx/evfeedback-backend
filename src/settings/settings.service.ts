import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UpdateSettingsInput = {
  companyName?: string | null;
  logoUrl?: string | null;
  thankYouMessage?: string | null;
  primaryColor?: string | null;
  kioskResetSeconds?: number;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  cardBackgroundColor?: string | null;
  textColor?: string | null;
  buttonTextColor?: string | null;
  notificationEmails?: string | null;
  dailyNotificationEnabled?: boolean;
  monthlyNotificationEnabled?: boolean;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCompanyId(companyId?: string) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const existing = await this.prisma.setting.findUnique({
      where: {
        companyId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.setting.create({
      data: {
        companyId,
      },
    });
  }

  private normalizeEmails(value?: string | null) {
    if (!value?.trim()) {
      return null;
    }

    const emails = value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const uniqueEmails = Array.from(new Set(emails));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const invalid = uniqueEmails.find((email) => !emailRegex.test(email));

    if (invalid) {
      throw new BadRequestException(`E-mail inválido: ${invalid}`);
    }

    return uniqueEmails.join(', ');
  }

  async upsertByCompanyId(companyId: string | undefined, data: UpdateSettingsInput) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedEmails =
      data.notificationEmails !== undefined
        ? this.normalizeEmails(data.notificationEmails)
        : undefined;

    return this.prisma.setting.upsert({
      where: {
        companyId,
      },
      create: {
        companyId,
        companyName: data.companyName?.trim() || null,
        logoUrl: data.logoUrl?.trim() || null,
        thankYouMessage: data.thankYouMessage?.trim() || null,
        primaryColor: data.primaryColor?.trim() || null,
        kioskResetSeconds: data.kioskResetSeconds ?? 5,
        heroTitle: data.heroTitle?.trim() || null,
        heroSubtitle: data.heroSubtitle?.trim() || null,
        backgroundColor: data.backgroundColor?.trim() || null,
        backgroundImageUrl: data.backgroundImageUrl?.trim() || null,
        cardBackgroundColor: data.cardBackgroundColor?.trim() || null,
        textColor: data.textColor?.trim() || null,
        buttonTextColor: data.buttonTextColor?.trim() || null,
        notificationEmails: normalizedEmails ?? null,
        dailyNotificationEnabled: data.dailyNotificationEnabled ?? true,
        monthlyNotificationEnabled: data.monthlyNotificationEnabled ?? true,
      },
      update: {
        ...(data.companyName !== undefined
          ? { companyName: data.companyName?.trim() || null }
          : {}),
        ...(data.logoUrl !== undefined
          ? { logoUrl: data.logoUrl?.trim() || null }
          : {}),
        ...(data.thankYouMessage !== undefined
          ? { thankYouMessage: data.thankYouMessage?.trim() || null }
          : {}),
        ...(data.primaryColor !== undefined
          ? { primaryColor: data.primaryColor?.trim() || null }
          : {}),
        ...(data.kioskResetSeconds !== undefined
          ? { kioskResetSeconds: data.kioskResetSeconds }
          : {}),
        ...(data.heroTitle !== undefined
          ? { heroTitle: data.heroTitle?.trim() || null }
          : {}),
        ...(data.heroSubtitle !== undefined
          ? { heroSubtitle: data.heroSubtitle?.trim() || null }
          : {}),
        ...(data.backgroundColor !== undefined
          ? { backgroundColor: data.backgroundColor?.trim() || null }
          : {}),
        ...(data.backgroundImageUrl !== undefined
          ? { backgroundImageUrl: data.backgroundImageUrl?.trim() || null }
          : {}),
        ...(data.cardBackgroundColor !== undefined
          ? { cardBackgroundColor: data.cardBackgroundColor?.trim() || null }
          : {}),
        ...(data.textColor !== undefined
          ? { textColor: data.textColor?.trim() || null }
          : {}),
        ...(data.buttonTextColor !== undefined
          ? { buttonTextColor: data.buttonTextColor?.trim() || null }
          : {}),
        ...(normalizedEmails !== undefined
          ? { notificationEmails: normalizedEmails }
          : {}),
        ...(data.dailyNotificationEnabled !== undefined
          ? { dailyNotificationEnabled: data.dailyNotificationEnabled }
          : {}),
        ...(data.monthlyNotificationEnabled !== undefined
          ? { monthlyNotificationEnabled: data.monthlyNotificationEnabled }
          : {}),
      },
    });
  }
}