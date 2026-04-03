import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  create(companyId: string, data: CreateBranchDto) {
    return this.prisma.branch.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  findAll(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(companyId: string, id: string) {
    return this.prisma.branch.findFirst({
      where: { id, companyId },
    });
  }

  update(companyId: string, id: string, data: UpdateBranchDto) {
    return this.prisma.branch.updateMany({
      where: { id, companyId },
      data,
    });
  }

  remove(companyId: string, id: string) {
    return this.prisma.branch.deleteMany({
      where: { id, companyId },
    });
  }
}