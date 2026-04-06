import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  createAsSuperAdmin(data: CreateUserDto) {
    return this.createInternal(data.companyId!, data);
  }

  createForCompany(companyId: string, data: CreateUserDto) {
    return this.createInternal(companyId, data);
  }

  private async createInternal(companyId: string, data: CreateUserDto) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        companyId,
      },
    });
  }

  findAllForSuperAdmin() {
    return this.prisma.user.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllByCompany(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOneByCompany(companyId: string, id: string) {
    return this.prisma.user.findFirst({
      where: { id, companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findOneGlobal(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateGlobal(id: string, data: UpdateUserDto) {
    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
      companyId: data.companyId,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updateByCompany(companyId: string, id: string, data: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!existing) return null;

    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  removeGlobal(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  async removeByCompany(companyId: string, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!existing) return null;

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }
}