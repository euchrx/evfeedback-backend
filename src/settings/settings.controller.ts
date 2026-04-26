import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { SettingsService } from './settings.service';
import type { UploadedApkFile, UploadedLogoFile } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from '../notifications/notifications.service';

type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';

type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
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

type CreateSharedFeedbackAccessBody = {
  label?: string | null;
  expiresAt?: string | null;
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
      const normalizedRequestedCompanyId = requestedCompanyId?.trim();
      return normalizedRequestedCompanyId || undefined;
    }

    return user.companyId ?? undefined;
  }

  @Get('me')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findMySettings(
    @Req() req: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);
    return this.settingsService.findByCompanyId(resolvedCompanyId);
  }

  @Patch('me')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  updateMySettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateSettingsBody,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);
    return this.settingsService.upsertByCompanyId(resolvedCompanyId, body);
  }

  @Post('logo')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadLogo(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: UploadedLogoFile,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.settingsService.saveLogo(
      resolvedCompanyId,
      file,
      this.getBaseUrl(req),
    );
  }

  @Post('test-email')
  @Roles('SUPER_ADMIN')
  async sendTestEmail(
    @Req() req: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  async uploadAppApk(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: UploadedApkFile,
  ) {
    return this.settingsService.saveLatestApk(file, this.getBaseUrl(req));
  }

  @Get('shared-feedback-accesses')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  async listSharedFeedbackAccesses(
    @Req() req: AuthenticatedRequest,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);
    return this.settingsService.listSharedFeedbackAccesses(resolvedCompanyId);
  }

  @Post('shared-feedback-accesses')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  async createSharedFeedbackAccess(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateSharedFeedbackAccessBody,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.settingsService.createSharedFeedbackAccess(
      resolvedCompanyId,
      {
        label: body.label,
        expiresAt: body.expiresAt,
      },
      this.getBaseUrl(req),
    );
  }

  @Patch('shared-feedback-accesses/:id/deactivate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  async deactivateSharedFeedbackAccess(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.settingsService.deactivateSharedFeedbackAccess(
      resolvedCompanyId,
      id,
    );
  }
}