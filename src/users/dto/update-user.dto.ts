export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'MANAGER';
  active?: boolean;
  companyId?: string;
}