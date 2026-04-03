import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('rating') rating?: string,
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.feedbacksService.findAll(req.user.companyId, {
      rating,
      branchId,
      dateFrom,
      dateTo,
    });
  }
}