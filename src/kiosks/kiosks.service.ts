import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class KiosksService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: CreateKioskDto) {
    return this.prisma.kiosk.create({
      data: {
        name: data.name,
        branchId: data.branchId,
        companyId,
        token: randomUUID(),
      },
      include: {
        branch: true,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.kiosk.findMany({
      where: { companyId },
      include: {
        branch: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    return this.prisma.kiosk.findFirst({
      where: { id, companyId },
      include: {
        branch: true,
      },
    });
  }

  async remove(companyId: string, id: string) {
    return this.prisma.kiosk.updateMany({
      where: { id, companyId },
      data: { active: false },
    });
  }

  async updateStatus(companyId: string, id: string, active: boolean) {
    return this.prisma.kiosk.updateMany({
      where: { id, companyId },
      data: { active },
    });
  }

  async findByToken(token: string) {
    return this.prisma.kiosk.findUnique({
      where: { token },
      include: {
        branch: true,
        company: true,
      },
    });
  }
}