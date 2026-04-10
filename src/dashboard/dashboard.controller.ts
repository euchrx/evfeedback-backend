import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type AuthUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string | null;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  private resolveCompanyId(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      return requestedCompanyId || user.companyId || undefined;
    }

    return user.companyId ?? undefined;
  }

  @Get('summary')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  getSummary(
    @Req() req: any,
    @Query('companyId') companyId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.service.getSummary(resolvedCompanyId, {
      dateFrom,
      dateTo,
    });
  }

  @Get('by-branch')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  getByBranch(
    @Req() req: any,
    @Query('companyId') companyId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.service.getByBranch(resolvedCompanyId, {
      dateFrom,
      dateTo,
    });
  }
}