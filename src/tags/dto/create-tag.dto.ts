import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsString()
  companyId: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}