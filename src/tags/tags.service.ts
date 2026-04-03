import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(name: string) {
    return this.prisma.tag.create({
      data: { name },
    });
  }

  async remove(id: string) {
    return this.prisma.tag.delete({
      where: { id },
    });
  }
}