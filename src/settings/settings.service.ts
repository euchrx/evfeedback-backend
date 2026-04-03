import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UpdateSettingsDto = {
  companyName?: string;
  logoUrl?: string;
  thankYouMessage?: string;
  primaryColor?: string;
  kioskResetSeconds?: number;
  heroTitle?: string;
  heroSubtitle?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  cardBackgroundColor?: string;
  textColor?: string;
  buttonTextColor?: string;
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getByCompany(companyId: string) {
    return this.prisma.setting.upsert({
      where: { companyId },
      update: {},
      create: {
        companyId,
      },
    });
  }

  async updateByCompany(companyId: string, data: UpdateSettingsDto) {
    return this.prisma.setting.upsert({
      where: { companyId },
      update: {
        ...data,
      },
      create: {
        companyId,
        ...data,
      },
    });
  }
}