import { IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString({ message: 'Nome deve ser um texto.' })
  @MinLength(1, { message: 'Nome é obrigatório.' })
  name!: string;
}