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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  createAsSuperAdmin(@Body() body: CreateUserDto) {
    return this.usersService.createAsSuperAdmin(body);
  }

  @Roles('COMPANY_ADMIN')
  @Post('company')
  createForCompany(@Req() req: any, @Body() body: CreateUserDto) {
    return this.usersService.createForCompany(req.user.companyId, body);
  }

  @Roles('SUPER_ADMIN')
  @Get()
  findAllGlobal() {
    return this.usersService.findAllForSuperAdmin();
  }

  @Roles('COMPANY_ADMIN')
  @Get('company')
  findAllCompany(@Req() req: any) {
    return this.usersService.findAllByCompany(req.user.companyId);
  }

  @Roles('SUPER_ADMIN')
  @Get(':id')
  findOneGlobal(@Param('id') id: string) {
    return this.usersService.findOneGlobal(id);
  }

  @Roles('COMPANY_ADMIN')
  @Get('company/:id')
  findOneCompany(@Req() req: any, @Param('id') id: string) {
    return this.usersService.findOneByCompany(req.user.companyId, id);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id')
  updateGlobal(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.updateGlobal(id, body);
  }

  @Roles('COMPANY_ADMIN')
  @Patch('company/:id')
  updateCompany(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateByCompany(req.user.companyId, id, body);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  removeGlobal(@Param('id') id: string) {
    return this.usersService.removeGlobal(id);
  }

  @Roles('COMPANY_ADMIN')
  @Delete('company/:id')
  removeCompany(@Req() req: any, @Param('id') id: string) {
    return this.usersService.removeByCompany(req.user.companyId, id);
  }
}