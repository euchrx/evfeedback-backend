import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      throw new UnauthorizedException('Email e senha são obrigatórios.');
    }

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    const isValid = await bcrypt.compare(normalizedPassword, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    if (!user.active) {
      throw new ForbiddenException('Usuário desativado.');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? null,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId ?? null,
        active: user.active,
      },
    };
  }
}