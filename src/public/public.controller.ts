import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import type { Response } from 'express';

@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) { }

  @Get('kiosk/config')
  getKioskConfig(@Query('token') token?: string) {
    return this.publicService.getKioskConfig(token ?? '');
  }

  @Post('kiosk/feedback')
  createFeedback(@Body() dto: CreateFeedbackDto) {
    return this.publicService.createFeedback(dto);
  }

  @Get('kiosk/tags')
  getKioskTags(@Query('token') token?: string) {
    return this.publicService.getKioskTags(token ?? '');
  }

  @Get('public/feedbacks')
  getSharedFeedbacks(
    @Query('token') token?: string,
    @Query('branchId') branchId?: string,
    @Query('kioskId') kioskId?: string,
    @Query('rating') rating?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.publicService.getSharedFeedbacks({
      token: token ?? '',
      branchId,
      kioskId,
      rating,
      startDate,
      endDate,
    });
  }

  @Get('downloads/logos/:fileName')
  async downloadLogo(@Param('fileName') fileName: string, @Res() res: Response) {
    const logo = await this.publicService.getLogoFile(fileName);

    res.setHeader('Content-Type', logo.contentType);
    return res.sendFile(logo.path);
  }

  @Get('downloads/app/latest')
  async downloadLatestApp(@Res() res: Response) {
    const apk = await this.publicService.getLatestAppApk();

    res.setHeader('Content-Type', apk.contentType);
    return res.download(apk.path, apk.downloadName);
  }
}