import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString({ message: 'Token deve ser um texto.' })
  @MinLength(1, { message: 'Token do kiosk é obrigatório.' })
  token!: string;

  @IsInt({ message: 'A nota deve ser um número inteiro.' })
  @Min(1, { message: 'A nota mínima é 1.' })
  @Max(5, { message: 'A nota máxima é 5.' })
  rating!: number;

  @IsOptional()
  @IsString({ message: 'Comentário deve ser um texto.' })
  comment?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim().toLowerCase();
    return trimmed || undefined;
  })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email?: string;

  @IsOptional()
  @IsArray({ message: 'tagIds deve ser uma lista.' })
  @ArrayUnique({ message: 'tagIds não pode conter valores duplicados.' })
  @IsString({ each: true, message: 'Cada tagId deve ser um texto.' })
  tagIds?: string[];

  @IsOptional()
  @IsString({ message: 'Nome de contato deve ser um texto.' })
  contactName?: string;

  @IsOptional()
  @IsString({ message: 'Telefone de contato deve ser um texto.' })
  contactPhone?: string;

  @IsOptional()
  @IsString({ message: 'Mensagem de contato deve ser um texto.' })
  contactMessage?: string;

  @IsOptional()
  @IsBoolean({ message: 'contactConsent deve ser boolean.' })
  contactConsent?: boolean;
}