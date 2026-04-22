import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome não pode ser vazio.' })
  name?: string;

  @IsOptional()
  @IsBoolean({ message: 'active deve ser boolean.' })
  active?: boolean;
}