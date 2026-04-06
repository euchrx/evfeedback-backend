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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createGlobal(@Body() body: CreateUserDto) {
    return this.usersService.createGlobal(body);
  }

  @Post('company')
  createForCompany(@Req() req: any, @Body() body: CreateUserDto) {
    return this.usersService.createForCompany(req.user.companyId, body);
  }

  @Get()
  findAllGlobal() {
    return this.usersService.findAllGlobal();
  }

  @Get('company')
  findAllCompany(@Req() req: any) {
    return this.usersService.findAllByCompany(req.user.companyId);
  }

  @Get(':id')
  findOneGlobal(@Param('id') id: string) {
    return this.usersService.findOneGlobal(id);
  }

  @Get('company/:id')
  findOneCompany(@Req() req: any, @Param('id') id: string) {
    return this.usersService.findOneByCompany(req.user.companyId, id);
  }

  @Patch(':id')
  updateGlobal(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.updateGlobal(id, body);
  }

  @Patch('company/:id')
  updateCompany(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateByCompany(req.user.companyId, id, body);
  }

  @Delete(':id')
  removeGlobal(@Param('id') id: string) {
    return this.usersService.removeGlobal(id);
  }

  @Delete('company/:id')
  removeCompany(@Req() req: any, @Param('id') id: string) {
    return this.usersService.removeByCompany(req.user.companyId, id);
  }
}