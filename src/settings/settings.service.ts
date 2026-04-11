import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';

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

type ApkMetadata = {
  originalName: string;
  storedName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

export type UploadedApkFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly apkDirectory = join(process.cwd(), 'storage', 'apk');
  private readonly apkFileName = 'evfeedback-latest.apk';
  private readonly apkMetadataFile = join(this.apkDirectory, 'metadata.json');

  private async ensureCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada para carregar as configurações.',
      );
    }
  }

  async findByCompanyId(companyId?: string) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    await this.ensureCompanyExists(companyId);

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
      .split(/[\n,;]+/)
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

  async upsertByCompanyId(
    companyId: string | undefined,
    data: UpdateSettingsInput,
  ) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    await this.ensureCompanyExists(companyId);

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

  private async ensureApkDirectory() {
    await mkdir(this.apkDirectory, { recursive: true });
  }

  private getApkFilePath() {
    return join(this.apkDirectory, this.apkFileName);
  }

  private async readApkMetadata(): Promise<ApkMetadata | null> {
    if (!existsSync(this.apkMetadataFile)) {
      return null;
    }

    try {
      const content = await readFile(this.apkMetadataFile, 'utf-8');
      return JSON.parse(content) as ApkMetadata;
    } catch {
      return null;
    }
  }

  async getLatestApkInfo(baseUrl?: string) {
    const filePath = this.getApkFilePath();
    const metadata = await this.readApkMetadata();

    if (!metadata || !existsSync(filePath)) {
      return null;
    }

    const fileStats = await stat(filePath);
    const downloadPath = '/downloads/app/latest';

    return {
      originalName: metadata.originalName,
      storedName: metadata.storedName,
      contentType: metadata.contentType,
      size: fileStats.size,
      uploadedAt: metadata.uploadedAt,
      downloadPath,
      downloadUrl: baseUrl ? `${baseUrl}${downloadPath}` : downloadPath,
    };
  }

  async saveLatestApk(file: UploadedApkFile | undefined, baseUrl?: string) {
    if (!file) {
      throw new BadRequestException('Envie um arquivo APK.');
    }

    const fileName = file.originalname?.trim() || '';

    if (
      !fileName.toLowerCase().endsWith('.apk') ||
      extname(fileName).toLowerCase() !== '.apk'
    ) {
      throw new BadRequestException('O arquivo enviado deve ter extensão .apk.');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('O arquivo APK enviado está vazio.');
    }

    await this.ensureApkDirectory();

    const filePath = this.getApkFilePath();
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    await writeFile(filePath, file.buffer);

    const metadata: ApkMetadata = {
      originalName: fileName,
      storedName: this.apkFileName,
      contentType: file.mimetype || 'application/vnd.android.package-archive',
      size: file.size ?? file.buffer.length,
      uploadedAt: new Date().toISOString(),
    };

    await writeFile(
      this.apkMetadataFile,
      JSON.stringify(metadata, null, 2),
      'utf-8',
    );

    return this.getLatestApkInfo(baseUrl);
  }

  async getLatestApkFile() {
    const filePath = this.getApkFilePath();
    const metadata = await this.readApkMetadata();

    if (!metadata || !existsSync(filePath)) {
      throw new NotFoundException('Nenhum APK foi enviado ainda.');
    }

    return {
      path: filePath,
      contentType:
        metadata.contentType || 'application/vnd.android.package-archive',
      downloadName: metadata.originalName || this.apkFileName,
    };
  }
}
