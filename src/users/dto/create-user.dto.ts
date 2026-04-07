export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MANAGER';
  companyId?: string;
  active?: boolean;
}