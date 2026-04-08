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
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

type AuthUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string | null;
};

type EnvironmentType = 'POSTO' | 'CONVENIENCIA' | 'RESTAURANTE';

type CreateTagBody = {
  name: string;
  color?: string | null;
  environmentType?: EnvironmentType;
  active?: boolean;
  companyId?: string;
};

type UpdateTagBody = {
  name?: string;
  color?: string | null;
  environmentType?: EnvironmentType;
  active?: boolean;
  companyId?: string;
};

type ImportTagsBySegmentBody = {
  segment: 'RESTAURANTE' | 'CONVENIENCIA' | 'POSTO';
  companyId?: string;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  private resolveCompanyId(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      return requestedCompanyId;
    }

    return user.companyId ?? undefined;
  }

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findAll(
    @Req() req: any,
    @Query('companyId') companyId?: string,
    @Query('active') active?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    const parsedActive =
      active === undefined ? undefined : active === 'true';

    return this.tagsService.findAll(resolvedCompanyId, parsedActive);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.findOne(id, resolvedCompanyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  create(@Req() req: any, @Body() body: CreateTagBody) {
    const user = req.user as AuthUser;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? body.companyId
        : (user.companyId ?? undefined);

    return this.tagsService.create({
      name: body.name,
      color: body.color,
      environmentType: body.environmentType,
      active: body.active,
      companyId: resolvedCompanyId,
    });
  }

  @Post('import-by-segment')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  importBySegment(@Req() req: any, @Body() body: ImportTagsBySegmentBody) {
    const user = req.user as AuthUser;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? body.companyId
        : (user.companyId ?? undefined);

    return this.tagsService.importBySegment(body.segment, resolvedCompanyId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTagBody,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? body.companyId ?? companyId
        : (user.companyId ?? undefined);

    return this.tagsService.update(id, resolvedCompanyId, body);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  deactivate(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.deactivate(id, resolvedCompanyId);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  activate(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.activate(id, resolvedCompanyId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  hardDelete(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.hardDelete(id, resolvedCompanyId);
  }
}