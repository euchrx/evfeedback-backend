import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        active: true,
      },
    });
  }

  async createGlobal(data: CreateUserDto) {
    if (!data.companyId) {
      throw new BadRequestException(
        'companyId é obrigatório para criação global de usuário',
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        companyId: data.companyId,
        active: true,
      },
      include: {
        company: true,
      },
    });
  }

  async createForCompany(companyId: string, data: CreateUserDto) {
    if (data.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Usuário da empresa não pode criar SUPER_ADMIN',
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        companyId,
        active: true,
      },
      include: {
        company: true,
      },
    });
  }

  findAllGlobal() {
    return this.prisma.user.findMany({
      where: {
        active: true,
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAllByCompany(companyId: string) {
    return this.prisma.user.findMany({
      where: {
        companyId,
        active: true,
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOneGlobal(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
  }

  findOneByCompany(companyId: string, id: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        company: true,
      },
    });
  }

  async updateGlobal(id: string, data: UpdateUserDto) {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.companyId !== undefined) {
      updateData.company = {
        connect: { id: data.companyId },
      };
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
      },
    });
  }

  async updateByCompany(companyId: string, id: string, data: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (data.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Usuário da empresa não pode definir role SUPER_ADMIN',
      );
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.active !== undefined) updateData.active = data.active;

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
      },
    });
  }

  removeGlobal(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  async removeByCompany(companyId: string, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }
}