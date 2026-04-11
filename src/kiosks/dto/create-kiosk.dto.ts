import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateKioskDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  locationDescription?: string;

  @IsString()
  companyId: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
