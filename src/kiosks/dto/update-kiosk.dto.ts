import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
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
  @IsUUID('4', { message: 'companyId inválido.' })
  companyId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'branchId inválido.' })
  branchId?: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}