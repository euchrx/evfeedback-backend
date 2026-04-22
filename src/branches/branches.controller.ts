import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
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

type CreateBranchBody = {
  name: string;
  code?: string;
  active?: boolean;
  companyId?: string;
};

type UpdateBranchBody = {
  name?: string;
  code?: string;
  active?: boolean;
  companyId?: string;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

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
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.branchesService.findAll(resolvedCompanyId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.branchesService.findOne(id, resolvedCompanyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  create(@Req() req: { user: AuthUser }, @Body() body: CreateBranchBody) {
    const user = req.user;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? body.companyId?.trim() || undefined
        : (user.companyId ?? undefined);

    return this.branchesService.create({
      name: body.name,
      code: body.code,
      active: body.active,
      companyId: resolvedCompanyId,
    });
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() body: UpdateBranchBody,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? (body.companyId?.trim() || companyId?.trim() || undefined)
        : (user.companyId ?? undefined);

    return this.branchesService.update(id, resolvedCompanyId, {
      name: body.name,
      code: body.code,
      active: body.active,
      companyId: resolvedCompanyId,
    });
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  deactivate(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.branchesService.deactivate(id, resolvedCompanyId);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  activate(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.branchesService.activate(id, resolvedCompanyId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  hardDelete(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const resolvedCompanyId = this.resolveCompanyId(req.user, companyId);

    return this.branchesService.hardDelete(id, resolvedCompanyId);
  }
}