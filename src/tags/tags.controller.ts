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
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';

type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

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
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.findAll(resolvedCompanyId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findOne(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.findOne(id, resolvedCompanyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  create(@Req() req: { user: AuthUser }, @Body() body: CreateTagDto) {
    const user = req.user;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? body.companyId?.trim() || undefined
        : (user.companyId ?? undefined);

    return this.tagsService.create(resolvedCompanyId, {
      ...body,
      companyId: resolvedCompanyId,
    });
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() body: UpdateTagDto,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? (body.companyId?.trim() || companyId?.trim() || undefined)
        : (user.companyId ?? undefined);

    return this.tagsService.update(id, resolvedCompanyId, {
      ...body,
      ...(resolvedCompanyId !== undefined
        ? { companyId: resolvedCompanyId }
        : {}),
    });
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  deactivate(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.deactivate(id, resolvedCompanyId);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  activate(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.activate(id, resolvedCompanyId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  hardDelete(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.tagsService.hardDelete(id, resolvedCompanyId);
  }
}