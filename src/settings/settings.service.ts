import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
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

type CreateSharedFeedbackAccessInput = {
  label?: string | null;
  expiresAt?: string | null;
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
  constructor(private readonly prisma: PrismaService) { }

  private readonly apkDirectory = join(process.cwd(), 'storage', 'apk');
  private readonly apkFileName = 'evfeedback-latest.apk';
  private readonly apkMetadataFile = join(this.apkDirectory, 'metadata.json');
  private readonly maxApkSizeBytes = 100 * 1024 * 1024;

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateAccessToken() {
    return randomBytes(32).toString('hex');
  }

  private normalizeNullableText(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    return value?.trim() || null;
  }

  private async ensureCompanyExists(companyId: string) {
    const normalizedCompanyId = companyId.trim();

    if (!normalizedCompanyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: normalizedCompanyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada para carregar as configurações.',
      );
    }

    return normalizedCompanyId;
  }

  async findByCompanyId(companyId?: string) {
    if (!companyId?.trim()) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedCompanyId = await this.ensureCompanyExists(companyId);

    const existing = await this.prisma.setting.findUnique({
      where: {
        companyId: normalizedCompanyId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.setting.create({
      data: {
        companyId: normalizedCompanyId,
      },
    });
  }

  private normalizeEmails(value?: string | null) {
    if (value == null) {
      return null;
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return null;
    }

    const emails = normalizedValue
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
    if (!companyId?.trim()) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedCompanyId = await this.ensureCompanyExists(companyId);

    if (
      data.kioskResetSeconds !== undefined &&
      (!Number.isInteger(data.kioskResetSeconds) || data.kioskResetSeconds < 1)
    ) {
      throw new BadRequestException(
        'kioskResetSeconds deve ser um número inteiro maior que zero.',
      );
    }

    const normalizedEmails = this.normalizeEmails(data.notificationEmails);

    return this.prisma.setting.upsert({
      where: {
        companyId: normalizedCompanyId,
      },
      create: {
        companyId: normalizedCompanyId,
        companyName: this.normalizeNullableText(data.companyName) ?? null,
        logoUrl: this.normalizeNullableText(data.logoUrl) ?? null,
        thankYouMessage: this.normalizeNullableText(data.thankYouMessage) ?? null,
        primaryColor: this.normalizeNullableText(data.primaryColor) ?? null,
        kioskResetSeconds: data.kioskResetSeconds ?? 5,
        heroTitle: this.normalizeNullableText(data.heroTitle) ?? null,
        heroSubtitle: this.normalizeNullableText(data.heroSubtitle) ?? null,
        backgroundColor: this.normalizeNullableText(data.backgroundColor) ?? null,
        backgroundImageUrl:
          this.normalizeNullableText(data.backgroundImageUrl) ?? null,
        cardBackgroundColor:
          this.normalizeNullableText(data.cardBackgroundColor) ?? null,
        textColor: this.normalizeNullableText(data.textColor) ?? null,
        buttonTextColor: this.normalizeNullableText(data.buttonTextColor) ?? null,
        notificationEmails: normalizedEmails ?? null,
        dailyNotificationEnabled: data.dailyNotificationEnabled ?? true,
        monthlyNotificationEnabled: data.monthlyNotificationEnabled ?? true,
      },
      update: {
        ...(data.companyName !== undefined
          ? { companyName: this.normalizeNullableText(data.companyName) }
          : {}),
        ...(data.logoUrl !== undefined
          ? { logoUrl: this.normalizeNullableText(data.logoUrl) }
          : {}),
        ...(data.thankYouMessage !== undefined
          ? { thankYouMessage: this.normalizeNullableText(data.thankYouMessage) }
          : {}),
        ...(data.primaryColor !== undefined
          ? { primaryColor: this.normalizeNullableText(data.primaryColor) }
          : {}),
        ...(data.kioskResetSeconds !== undefined
          ? { kioskResetSeconds: data.kioskResetSeconds }
          : {}),
        ...(data.heroTitle !== undefined
          ? { heroTitle: this.normalizeNullableText(data.heroTitle) }
          : {}),
        ...(data.heroSubtitle !== undefined
          ? { heroSubtitle: this.normalizeNullableText(data.heroSubtitle) }
          : {}),
        ...(data.backgroundColor !== undefined
          ? { backgroundColor: this.normalizeNullableText(data.backgroundColor) }
          : {}),
        ...(data.backgroundImageUrl !== undefined
          ? {
            backgroundImageUrl: this.normalizeNullableText(
              data.backgroundImageUrl,
            ),
          }
          : {}),
        ...(data.cardBackgroundColor !== undefined
          ? {
            cardBackgroundColor: this.normalizeNullableText(
              data.cardBackgroundColor,
            ),
          }
          : {}),
        ...(data.textColor !== undefined
          ? { textColor: this.normalizeNullableText(data.textColor) }
          : {}),
        ...(data.buttonTextColor !== undefined
          ? { buttonTextColor: this.normalizeNullableText(data.buttonTextColor) }
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

  async listSharedFeedbackAccesses(companyId?: string) {
    if (!companyId?.trim()) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedCompanyId = await this.ensureCompanyExists(companyId);

    return this.prisma.sharedFeedbackAccess.findMany({
      where: {
        companyId: normalizedCompanyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        label: true,
        active: true,
        expiresAt: true,
        lastAccessAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createSharedFeedbackAccess(
    companyId: string | undefined,
    data: CreateSharedFeedbackAccessInput,
    baseUrl?: string,
  ) {
    if (!companyId?.trim()) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedCompanyId = await this.ensureCompanyExists(companyId);

    let expiresAt: Date | null = null;

    if (data.expiresAt?.trim()) {
      expiresAt = new Date(data.expiresAt.trim());

      if (Number.isNaN(expiresAt.getTime())) {
        throw new BadRequestException('expiresAt inválido.');
      }
    }

    const token = this.generateAccessToken();
    const tokenHash = this.hashToken(token);

    const created = await this.prisma.sharedFeedbackAccess.create({
      data: {
        companyId: normalizedCompanyId,
        label: this.normalizeNullableText(data.label) ?? null,
        tokenHash,
        expiresAt,
        active: true,
      },
      select: {
        id: true,
        label: true,
        active: true,
        expiresAt: true,
        lastAccessAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const path = `/shared/feedbacks?token=${encodeURIComponent(token)}`;

    return {
      ...created,
      token,
      url: baseUrl ? `${baseUrl}${path}` : path,
    };
  }

  async deactivateSharedFeedbackAccess(
    companyId: string | undefined,
    id: string,
  ) {
    if (!companyId?.trim()) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    const normalizedCompanyId = await this.ensureCompanyExists(companyId);
    const normalizedId = id?.trim();

    if (!normalizedId) {
      throw new BadRequestException('id é obrigatório.');
    }

    const existing = await this.prisma.sharedFeedbackAccess.findFirst({
      where: {
        id: normalizedId,
        companyId: normalizedCompanyId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Link compartilhado não encontrado.');
    }

    return this.prisma.sharedFeedbackAccess.update({
      where: {
        id: existing.id,
      },
      data: {
        active: false,
      },
      select: {
        id: true,
        label: true,
        active: true,
        expiresAt: true,
        lastAccessAt: true,
        createdAt: true,
        updatedAt: true,
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
    const extension = extname(fileName).toLowerCase();
    const normalizedMimeType = (file.mimetype || '').toLowerCase();

    if (!fileName || extension !== '.apk') {
      throw new BadRequestException('O arquivo enviado deve ter extensão .apk.');
    }

    const allowedMimeTypes = [
      'application/vnd.android.package-archive',
      'application/octet-stream',
    ];

    if (normalizedMimeType && !allowedMimeTypes.includes(normalizedMimeType)) {
      throw new BadRequestException('Tipo de arquivo inválido para APK.');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('O arquivo APK enviado está vazio.');
    }

    if ((file.size ?? file.buffer.length) > this.maxApkSizeBytes) {
      throw new BadRequestException(
        'O arquivo APK excede o tamanho máximo permitido.',
      );
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
      contentType:
        file.mimetype || 'application/vnd.android.package-archive',
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