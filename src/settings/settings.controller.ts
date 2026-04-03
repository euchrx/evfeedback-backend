import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('me')
  getMine(@Req() req: any) {
    return this.settingsService.getByCompany(req.user.companyId);
  }

  @Patch('me')
  updateMine(
    @Req() req: any,
    @Body()
    body: {
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
    },
  ) {
    return this.settingsService.updateByCompany(req.user.companyId, body);
  }
}