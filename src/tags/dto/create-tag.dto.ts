import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTagDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome é obrigatório.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Cor deve ser um texto.' })
  color?: string;

  @IsString({ message: 'companyId inválido.' })
  @MinLength(1, { message: 'companyId inválido.' })
  companyId!: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}