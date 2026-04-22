import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateKioskDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome é obrigatório.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Descrição do local deve ser um texto.' })
  locationDescription?: string;

  @IsUUID('4', { message: 'companyId inválido.' })
  companyId!: string;

  @IsUUID('4', { message: 'branchId inválido.' })
  branchId!: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}