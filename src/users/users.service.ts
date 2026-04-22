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

type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';

type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
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

  private async ensureCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }
  }

  async create(
    companyId: string | undefined,
    data: CreateUserDto,
    actor: AuthUser,
  ) {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const password = data.password?.trim();
    const role = data.role;

    if (!name) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    if (!email) {
      throw new BadRequestException('Email é obrigatório.');
    }

    if (!password) {
      throw new BadRequestException('Senha é obrigatória.');
    }

    if (!role) {
      throw new BadRequestException('Role é obrigatória.');
    }

    if (actor.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode criar outro SUPER_ADMIN.',
      );
    }

    if (actor.role === 'COMPANY_ADMIN' && role === 'COMPANY_ADMIN') {
      throw new ForbiddenException(
        'COMPANY_ADMIN não pode criar outro COMPANY_ADMIN.',
      );
    }

    const targetCompanyId = role === 'SUPER_ADMIN' ? null : (companyId ?? null);

    if (role !== 'SUPER_ADMIN' && !targetCompanyId) {
      throw new BadRequestException(
        'companyId é obrigatório para COMPANY_ADMIN e MANAGER.',
      );
    }

    if (role === 'SUPER_ADMIN' && data.companyId) {
      throw new BadRequestException(
        'SUPER_ADMIN não deve estar vinculado a uma empresa.',
      );
    }

    if (targetCompanyId) {
      await this.ensureCompanyExists(targetCompanyId);
    }

    const emailExists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailExists) {
      throw new BadRequestException('Já existe um usuário com este email.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        companyId: targetCompanyId,
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

    if (
      actor.role === 'COMPANY_ADMIN' &&
      data.role === 'COMPANY_ADMIN' &&
      existing.role !== 'COMPANY_ADMIN'
    ) {
      throw new ForbiddenException(
        'COMPANY_ADMIN não pode promover outro usuário para COMPANY_ADMIN.',
      );
    }

    const nextRole = data.role ?? existing.role;
    let targetCompanyId: string | null = existing.companyId ?? null;

    if (nextRole === 'SUPER_ADMIN') {
      targetCompanyId = null;
    } else if (actor.role === 'SUPER_ADMIN') {
      if (data.companyId !== undefined) {
        const normalizedCompanyId = data.companyId?.trim() || null;
        targetCompanyId = normalizedCompanyId;
      }
    } else {
      targetCompanyId = actor.companyId ?? null;
    }

    if (nextRole !== 'SUPER_ADMIN' && !targetCompanyId) {
      throw new BadRequestException(
        'companyId é obrigatório para COMPANY_ADMIN e MANAGER.',
      );
    }

    if (nextRole === 'SUPER_ADMIN' && data.companyId) {
      throw new BadRequestException(
        'SUPER_ADMIN não deve estar vinculado a uma empresa.',
      );
    }

    if (targetCompanyId) {
      await this.ensureCompanyExists(targetCompanyId);
    }

    if (
      data.email !== undefined &&
      data.email.trim().toLowerCase() !== existing.email
    ) {
      const normalizedEmail = data.email.trim().toLowerCase();

      const emailExists = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (emailExists && emailExists.id !== existing.id) {
        throw new BadRequestException('Já existe um usuário com este email.');
      }
    }

    if (actor.userId === existing.id && data.role && data.role !== existing.role) {
      throw new ForbiddenException(
        'Você não pode alterar o próprio papel de acesso.',
      );
    }

    const updateData: {
      name?: string;
      email?: string;
      role?: UserRole;
      active?: boolean;
      companyId?: string | null;
      passwordHash?: string;
    } = {};

    if (data.name !== undefined) {
      const normalizedName = data.name.trim();

      if (!normalizedName) {
        throw new BadRequestException('Nome é obrigatório.');
      }

      updateData.name = normalizedName;
    }

    if (data.email !== undefined) {
      const normalizedEmail = data.email.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new BadRequestException('Email é obrigatório.');
      }

      updateData.email = normalizedEmail;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    if (actor.role === 'SUPER_ADMIN' || nextRole === 'SUPER_ADMIN') {
      updateData.companyId = targetCompanyId;
    } else {
      updateData.companyId = actor.companyId ?? null;
    }

    if (data.password !== undefined) {
      const normalizedPassword = data.password.trim();

      if (!normalizedPassword) {
        throw new BadRequestException('Senha inválida.');
      }

      updateData.passwordHash = await bcrypt.hash(normalizedPassword, 10);
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

    if (actor.userId === existing.id) {
      throw new ForbiddenException(
        'Você não pode desativar seu próprio usuário.',
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

    if (actor.role !== 'SUPER_ADMIN' && existing.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Apenas SUPER_ADMIN pode excluir outro SUPER_ADMIN.',
      );
    }

    if (actor.userId === existing.id) {
      throw new ForbiddenException(
        'Você não pode excluir seu próprio usuário.',
      );
    }

    return this.prisma.user.delete({
      where: { id: existing.id },
    });
  }
}