import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsEmail,
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

  @IsString()
  @IsEmail()
  email: string;

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
