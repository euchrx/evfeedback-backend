import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
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
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  private resolveCompanyId(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      const normalizedRequestedCompanyId = requestedCompanyId?.trim();
      return normalizedRequestedCompanyId || undefined;
    }

    return user.companyId ?? undefined;
  }

  @Get('summary')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  getSummary(
    @Req() req: { user: AuthUser },
    @Query('companyId') companyId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.service.getSummary(resolvedCompanyId, {
      dateFrom,
      dateTo,
    });
  }

  @Get('by-branch')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  getByBranch(
    @Req() req: { user: AuthUser },
    @Query('companyId') companyId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.service.getByBranch(resolvedCompanyId, {
      dateFrom,
      dateTo,
    });
  }
}