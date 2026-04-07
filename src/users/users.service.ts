import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type AuthUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
  }

  async findAll(companyId?: string) {
    return this.prisma.user.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async create(
    companyId: string | undefined,
    data: CreateUserDto,
    actorRole: AuthUser['role'],
  ) {
    if (!companyId) {
      throw new BadRequestException('companyId é obrigatório.');
    }

    if (!data.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    if (!data.email?.trim()) {
      throw new BadRequestException('Email é obrigatório.');
    }

    if (!data.password?.trim()) {
      throw new BadRequestException('Senha é obrigatória.');
    }

    if (!data.role) {
      throw new BadRequestException('Role é obrigatória.');
    }

    if (actorRole !== 'SUPER_ADMIN' && data.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode criar outro SUPER_ADMIN.',
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const emailExists = await this.prisma.user.findUnique({
      where: { email: data.email.trim() },
      select: { id: true },
    });

    if (emailExists) {
      throw new BadRequestException('Já existe um usuário com este email.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        passwordHash,
        role: data.role,
        companyId,
        active: data.active ?? true,
      },
      include: {
        company: true,
      },
    });
  }

  async update(
    id: string,
    companyId: string | undefined,
    data: UpdateUserDto,
    actor: AuthUser,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        company: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (actor.role !== 'SUPER_ADMIN' && existing.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode alterar outro SUPER_ADMIN.',
      );
    }

    if (actor.role !== 'SUPER_ADMIN' && data.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode promover alguém para SUPER_ADMIN.',
      );
    }

    let targetCompanyId = existing.companyId;

    if (actor.role === 'SUPER_ADMIN' && data.companyId !== undefined) {
      const targetCompany = await this.prisma.company.findUnique({
        where: { id: data.companyId },
        select: { id: true },
      });

      if (!targetCompany) {
        throw new NotFoundException('Empresa não encontrada.');
      }

      targetCompanyId = data.companyId;
    }

    if (data.email && data.email.trim().toLowerCase() !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email.trim().toLowerCase() },
        select: { id: true },
      });

      if (emailExists && emailExists.id !== existing.id) {
        throw new BadRequestException('Já existe um usuário com este email.');
      }
    }

    const updateData: any = {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.email !== undefined
        ? { email: data.email.trim().toLowerCase() }
        : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(actor.role === 'SUPER_ADMIN' && data.companyId !== undefined
        ? { companyId: targetCompanyId }
        : {}),
    };

    if (data.password?.trim()) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        company: true,
      },
    });
  }

  async deactivate(id: string, companyId: string | undefined, actor: AuthUser) {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (actor.role !== 'SUPER_ADMIN' && existing.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode desativar outro SUPER_ADMIN.',
      );
    }

    return this.prisma.user.update({
      where: { id: existing.id },
      data: {
        active: false,
      },
      include: {
        company: true,
      },
    });
  }

  async activate(id: string, companyId: string | undefined, actor: AuthUser) {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (actor.role !== 'SUPER_ADMIN' && existing.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode ativar outro SUPER_ADMIN.',
      );
    }

    return this.prisma.user.update({
      where: { id: existing.id },
      data: {
        active: true,
      },
      include: {
        company: true,
      },
    });
  }

  async hardDelete(id: string, companyId: string | undefined, actor: AuthUser) {
    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (actor.id === existing.id) {
      throw new ForbiddenException('Você não pode excluir seu próprio usuário.');
    }

    return this.prisma.user.delete({
      where: { id: existing.id },
    });
  }
}