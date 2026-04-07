import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type AuthUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string | null;
};

type UpdateSettingsBody = {
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('me')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  getMine(@Req() req: any) {
    const user = req.user as AuthUser;

    return this.settingsService.getByCompany(user.companyId ?? undefined);
  }

  @Patch('me')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  updateMine(@Req() req: any, @Body() body: UpdateSettingsBody) {
    const user = req.user as AuthUser;

    return this.settingsService.updateByCompany(user.companyId ?? undefined, body);
  }

  @Get('company/:companyId')
  @Roles('SUPER_ADMIN')
  getByCompany(@Param('companyId') companyId: string) {
    return this.settingsService.getByCompany(companyId);
  }

  @Patch('company/:companyId')
  @Roles('SUPER_ADMIN')
  updateByCompany(
    @Param('companyId') companyId: string,
    @Body() body: UpdateSettingsBody,
  ) {
    return this.settingsService.updateByCompany(companyId, body);
  }
}