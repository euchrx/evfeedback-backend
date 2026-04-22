import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import type { AppRole } from '../../auth/decorators/roles.decorator';
import { IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'Email inválido.' })
  email!: string;

  @IsString({ message: 'Senha deve ser um texto.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  password!: string;

  @IsIn(['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'], {
    message: 'Role inválida.',
  })
  role!: AppRole;

  @IsOptional()
  @IsUUID('4', { message: 'companyId inválido.' })
  companyId?: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}