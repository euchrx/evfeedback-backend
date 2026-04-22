import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';

type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  private resolveCompanyId(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      const normalizedRequestedCompanyId = requestedCompanyId?.trim();
      return normalizedRequestedCompanyId || undefined;
    }

    return user.companyId ?? undefined;
  }

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findAll(
    @Req() req: { user: AuthUser },
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('kioskId') kioskId?: string,
    @Query('rating') rating?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('active') active?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.feedbacksService.findAll({
      companyId: resolvedCompanyId,
      branchId,
      kioskId,
      rating,
      startDate,
      endDate,
      active,
    });
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  hardDelete(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.feedbacksService.hardDelete(id, resolvedCompanyId);
  }
}