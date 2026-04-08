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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type AuthUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string | null;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  private resolveCompanyId(user: AuthUser, requestedCompanyId?: string) {
    if (user.role === 'SUPER_ADMIN') {
      return requestedCompanyId;
    }

    return user.companyId ?? undefined;
  }

  @Get()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  findAll(@Req() req: any, @Query('companyId') companyId?: string) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.usersService.findAll(resolvedCompanyId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.usersService.findOne(id, resolvedCompanyId);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  create(@Req() req: any, @Body() body: CreateUserBody) {
    const user = req.user as AuthUser;

    const resolvedCompanyId =
      body.role === 'SUPER_ADMIN'
        ? undefined
        : user.role === 'SUPER_ADMIN'
          ? body.companyId
          : (user.companyId ?? undefined);

    return this.usersService.create({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      active: body.active,
      companyId: resolvedCompanyId,
    });
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;

    const resolvedCompanyId =
      user.role === 'SUPER_ADMIN'
        ? body.companyId ?? companyId
        : (user.companyId ?? undefined);

    return this.usersService.update(id, resolvedCompanyId, body, user);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  deactivate(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.usersService.deactivate(id, resolvedCompanyId, user);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  activate(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.usersService.activate(id, resolvedCompanyId, user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  hardDelete(
    @Req() req: any,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const user = req.user as AuthUser;
    const resolvedCompanyId = this.resolveCompanyId(user, companyId);

    return this.usersService.hardDelete(id, resolvedCompanyId, user);
  }
}