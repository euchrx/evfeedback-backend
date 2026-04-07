export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  active?: boolean;
  companyId?: string;
}