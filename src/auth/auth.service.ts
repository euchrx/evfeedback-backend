import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }
}