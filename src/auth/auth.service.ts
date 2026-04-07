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
  console.log('LOGIN EMAIL:', email);
  console.log('LOGIN PASSWORD EXISTS:', !!password);

  const user = await this.usersService.findByEmail(email);

  if (!user) {
    throw new UnauthorizedException('Usuário não encontrado');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new UnauthorizedException('Senha inválida');
  }

  const token = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  return {
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      active: user.active,
    },
  };
}
}