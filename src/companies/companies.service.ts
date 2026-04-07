import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: data.name,
      },
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return company;
  }

  async update(id: string, data: UpdateCompanyDto) {
    await this.ensureExists(id);

    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string) {
    await this.ensureExists(id);

    return this.prisma.company.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  async activate(id: string) {
    await this.ensureExists(id);

    return this.prisma.company.update({
      where: { id },
      data: {
        active: true,
      },
    });
  }

  async hardDelete(id: string) {
    await this.ensureExists(id);

    return this.prisma.company.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return company;
  }
}