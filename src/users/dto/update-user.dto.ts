import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import type { AppRole } from '../../auth/decorators/roles.decorator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome não pode ser vazio.' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Senha deve ser um texto.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  password?: string;

  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'], {
    message: 'Role inválida.',
  })
  role?: AppRole;

  @IsOptional()
  @IsString({ message: 'companyId inválido.' })
  @MinLength(1, { message: 'companyId inválido.' })
  companyId?: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}