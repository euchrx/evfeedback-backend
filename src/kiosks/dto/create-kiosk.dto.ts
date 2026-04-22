import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateKioskDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome é obrigatório.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Descrição do local deve ser um texto.' })
  locationDescription?: string;

  @IsString({ message: 'companyId inválido.' })
  @MinLength(1, { message: 'companyId inválido.' })
  companyId!: string;

  @IsString({ message: 'branchId inválido.' })
  @MinLength(1, { message: 'branchId inválido.' })
  branchId!: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}