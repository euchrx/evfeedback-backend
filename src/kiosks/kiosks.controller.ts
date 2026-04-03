import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('kiosks')
export class KiosksController {
  constructor(private readonly kiosksService: KiosksService) {}

  @Post()
  create(@Req() req: any, @Body() body: CreateKioskDto) {
    return this.kiosksService.create(req.user.companyId, body);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.kiosksService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.kiosksService.findOne(req.user.companyId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.kiosksService.updateStatus(
      req.user.companyId,
      id,
      body.active,
    );
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.kiosksService.remove(req.user.companyId, id);
  }
}