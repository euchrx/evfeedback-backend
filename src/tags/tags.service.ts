import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.tag.findMany({
      where: {
        companyId,
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(companyId: string, name: string) {
    return this.prisma.tag.create({
      data: {
        name,
        companyId,
      },
    });
  }

  async remove(companyId: string, id: string) {
    return this.prisma.tag.updateMany({
      where: {
        id,
        companyId,
      },
      data: {
        active: false,
      },
    });
  }
}