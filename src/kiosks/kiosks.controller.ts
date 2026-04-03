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

@UseGuards(JwtAuthGuard)
@Controller('kiosks')
export class KiosksController {
  constructor(private service: KiosksService) {}

  @Post()
  create(@Body() body: CreateKioskDto) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}