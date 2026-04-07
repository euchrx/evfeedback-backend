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
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kiosks')
export class KiosksController {
  constructor(private readonly kiosksService: KiosksService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  create(@Req() req: any, @Body() body: CreateKioskDto) {
    const companyId =
      req.user.role === 'SUPER_ADMIN' ? body.companyId : req.user.companyId;

    return this.kiosksService.create(companyId, body);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findAll(@Req() req: any, @Query('companyId') companyId?: string) {
    const targetCompanyId =
      req.user.role === 'SUPER_ADMIN' ? companyId : req.user.companyId;

    return this.kiosksService.findAll(targetCompanyId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const targetCompanyId =
      req.user.role === 'SUPER_ADMIN' ? companyId : req.user.companyId;

    return this.kiosksService.findOne(targetCompanyId, id);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { active: boolean },
    @Query('companyId') companyId?: string,
  ) {
    const targetCompanyId =
      req.user.role === 'SUPER_ADMIN' ? companyId : req.user.companyId;

    return this.kiosksService.updateStatus(
      targetCompanyId,
      id,
      body.active,
    );
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  remove(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const targetCompanyId =
      req.user.role === 'SUPER_ADMIN' ? companyId : req.user.companyId;

    return this.kiosksService.remove(targetCompanyId, id);
  }
}