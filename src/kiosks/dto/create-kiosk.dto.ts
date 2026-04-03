import { IsOptional, IsString } from 'class-validator';

export class CreateKioskDto {
  @IsString()
  name: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  locationDescription?: string;
}