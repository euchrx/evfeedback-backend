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
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private service: BranchesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  create(@Req() req: any, @Body() body: CreateBranchDto) {
    const companyId =
      req.user.role === 'SUPER_ADMIN' ? body.companyId : req.user.companyId;

    return this.service.create(companyId, body);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER')
  findAll(@Req() req: any, @Query('companyId') companyId?: string) {
    const targetCompanyId =
      req.user.role === 'SUPER_ADMIN' ? companyId : req.user.companyId;

    return this.service.findAll(targetCompanyId);
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

    return this.service.findOne(targetCompanyId, id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateBranchDto,
    @Query('companyId') companyId?: string,
  ) {
    const targetCompanyId =
      req.user.role === 'SUPER_ADMIN'
        ? body.companyId ?? companyId
        : req.user.companyId;

    return this.service.update(targetCompanyId, id, body);
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

    return this.service.remove(targetCompanyId, id);
  }
}