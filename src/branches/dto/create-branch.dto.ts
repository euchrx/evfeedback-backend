import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome da filial é obrigatório.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Código deve ser um texto.' })
  code?: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'companyId inválido.' })
  companyId?: string;
}