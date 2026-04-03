import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) { }

  @Get('summary')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('by-branch')
  getByBranch() {
    return this.service.getByBranch();
  }
}