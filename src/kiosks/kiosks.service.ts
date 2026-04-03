import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class KiosksService {
  constructor(private prisma: PrismaService) { }

  async create(data: CreateKioskDto) {
    return this.prisma.kiosk.create({
      data: {
        name: data.name,
        branchId: data.branchId,
        token: randomUUID(),
      },
      include: {
        branch: true,
      },
    });
  }

  async findAll() {
    return this.prisma.kiosk.findMany({
      include: {
        branch: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.kiosk.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.kiosk.update({
      where: { id },
      data: { active: false },
      include: {
        branch: true,
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.kiosk.findUnique({
      where: { token },
      include: {
        branch: true,
      },
    });
  }

  async updateStatus(id: string, active: boolean) {
    return this.prisma.kiosk.update({
      where: { id },
      data: { active },
      include: {
        branch: true,
      },
    });
  }
}