import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateBranchDto) {
    return this.prisma.branch.create({
      data,
    });
  }

  findAll() {
    return this.prisma.branch.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
    });
  }

  update(id: string, data: UpdateBranchDto) {
    return this.prisma.branch.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}