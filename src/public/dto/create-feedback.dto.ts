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
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  token: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim().toLowerCase();
    return trimmed ? trimmed : undefined;
  })
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactMessage?: string;

  @IsOptional()
  @IsBoolean()
  contactConsent?: boolean;
}