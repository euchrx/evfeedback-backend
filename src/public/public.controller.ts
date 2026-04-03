import { Body, Controller, Post } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller('kiosk')
export class PublicController {
  constructor(private service: PublicService) {}

  @Post('feedback')
  create(@Body() body: CreateFeedbackDto) {
    return this.service.createFeedback(body);
  }
}