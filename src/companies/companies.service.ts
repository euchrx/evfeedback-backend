import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }

  findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
    });
  }

  update(id: string, data: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.company.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }
}