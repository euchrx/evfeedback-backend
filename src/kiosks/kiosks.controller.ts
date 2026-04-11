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
import { KiosksService } from './kiosks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskDto } from './dto/update-kiosk.dto';

type AuthUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string | null;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kiosks')
export class KiosksController {
  constructor(private readonly kiosksService: KiosksService) {}

  private resolveCompanyId(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      return requestedCompanyId || undefined;
    }

    return user.companyId ?? undefined;
  }

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findAll(@Req() req: any, @Query('companyId') companyId?: string) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.kiosksService.findAll(resolvedCompanyId);
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

    return this.kiosksService.findOne(id, resolvedCompanyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  create(@Req() req: any, @Body() body: CreateKioskDto) {
    const user = req.user as AuthUser;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? body.companyId
        : (user.companyId ?? undefined);

    return this.kiosksService.create(resolvedCompanyId, {
      ...body,
      companyId: resolvedCompanyId,
    });
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateKioskDto,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? (body.companyId ?? companyId)
        : (user.companyId ?? undefined);

    return this.kiosksService.update(id, resolvedCompanyId, {
      ...body,
      ...(resolvedCompanyId !== undefined
        ? { companyId: resolvedCompanyId }
        : {}),
    });
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  deactivate(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.kiosksService.deactivate(id, resolvedCompanyId);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  activate(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.kiosksService.activate(id, resolvedCompanyId);
  }

  @Patch(':id/regenerate-token')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  regenerateToken(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.kiosksService.regenerateToken(id, resolvedCompanyId);
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

    return this.kiosksService.hardDelete(id, resolvedCompanyId);
  }
}
