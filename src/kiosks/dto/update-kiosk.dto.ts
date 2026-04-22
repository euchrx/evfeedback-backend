import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateKioskDto {
  @IsOptional()
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome não pode ser vazio.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Descrição do local deve ser um texto.' })
  locationDescription?: string;

  @IsOptional()
  @IsString({ message: 'companyId inválido.' })
  @MinLength(1, { message: 'companyId inválido.' })
  companyId?: string;

  @IsOptional()
  @IsString({ message: 'branchId inválido.' })
  @MinLength(1, { message: 'branchId inválido.' })
  branchId?: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}