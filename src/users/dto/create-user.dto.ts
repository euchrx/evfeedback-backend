import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'])
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
