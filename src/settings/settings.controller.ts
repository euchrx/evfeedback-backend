import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { UploadedApkFile } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BadRequestException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

type AuthUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string | null;
};

type AuthenticatedRequest = Request & {
  user: AuthUser;
};

type UpdateSettingsBody = {
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getBaseUrl(req: Request) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol =
      typeof forwardedProto === 'string'
        ? forwardedProto.split(',')[0].trim()
        : req.protocol;

    return `${protocol}://${req.get('host')}`;
  }

  private resolveCompanyId(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      return requestedCompanyId;
    }

    return user.companyId ?? undefined;
  }

  @Get('me')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findMySettings(
    @Req() req: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.settingsService.findByCompanyId(resolvedCompanyId);
  }

  @Patch('me')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  updateMySettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateSettingsBody,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.settingsService.upsertByCompanyId(resolvedCompanyId, body);
  }

  @Post('test-email')
  @Roles('SUPER_ADMIN')
  async sendTestEmail(
    @Req() req: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    if (!resolvedCompanyId) {
      throw new BadRequestException(
        'Nenhuma empresa foi identificada para enviar o e-mail de teste.',
      );
    }

    return this.notificationsService.sendTestEmail(resolvedCompanyId);
  }

  @Get('app-apk')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  async getAppApk(@Req() req: AuthenticatedRequest) {
    return this.settingsService.getLatestApkInfo(this.getBaseUrl(req));
  }

  @Post('app-apk')
  @Roles('SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAppApk(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: UploadedApkFile,
  ) {
    return this.settingsService.saveLatestApk(file, this.getBaseUrl(req));
  }
}
