export class CreateKioskDto {
  name: string;
  token: string;
  branchId: string;
  locationDescription?: string;
  active?: boolean;
  companyId?: string;
}