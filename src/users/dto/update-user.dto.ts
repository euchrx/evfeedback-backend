import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER'])
  role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
