import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() body: CreateCompanyDto) {
    return this.companiesService.create(body);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateCompanyDto) {
    return this.companiesService.update(id, body);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN')
  deactivate(@Param('id') id: string) {
    return this.companiesService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN')
  activate(@Param('id') id: string) {
    return this.companiesService.activate(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  hardDelete(@Param('id') id: string) {
    return this.companiesService.hardDelete(id);
  }
}
