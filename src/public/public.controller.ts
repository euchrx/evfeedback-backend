import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

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
}