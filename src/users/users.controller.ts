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

  @Post()
  @Roles('SUPER_ADMIN')
  createGlobal(@Body() body: CreateUserDto) {
    return this.usersService.createGlobal(body);
  }

  @Post('company')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  createForCompany(@Req() req: any, @Body() body: CreateUserDto) {
    return this.usersService.createForCompany(req.user.companyId, body);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  findAllGlobal() {
    return this.usersService.findAllGlobal();
  }

  @Get('company')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  findAllCompany(@Req() req: any) {
    return this.usersService.findAllByCompany(req.user.companyId);
  }

  @Get('company/:id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  findOneCompany(@Req() req: any, @Param('id') id: string) {
    return this.usersService.findOneByCompany(req.user.companyId, id);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  findOneGlobal(@Param('id') id: string) {
    return this.usersService.findOneGlobal(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  updateGlobal(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.updateGlobal(id, body);
  }

  @Patch('company/:id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  updateCompany(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateByCompany(req.user.companyId, id, body);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  removeGlobal(@Param('id') id: string) {
    return this.usersService.removeGlobal(id);
  }

  @Delete('company/:id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  removeCompany(@Req() req: any, @Param('id') id: string) {
    return this.usersService.removeByCompany(req.user.companyId, id);
  }
}