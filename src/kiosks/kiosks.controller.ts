import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Delete, Param, Patch } from "@nestjs/common";

@UseGuards(JwtAuthGuard)
@Controller('kiosks')
export class KiosksController {
  constructor(private service: KiosksService) { }

  @Post()
  create(@Body() body: CreateKioskDto) {
    return this.service.create(body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.service.updateStatus(id, body.active);
  }
}
