import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class KiosksService {
  constructor(private prisma: PrismaService) {}

  private generateToken() {
    return randomBytes(32).toString('hex');
  }

  create(data: CreateKioskDto) {
    return this.prisma.kiosk.create({
      data: {
        ...data,
        token: this.generateToken(),
      },
    });
  }

  findAll() {
    return this.prisma.kiosk.findMany({
      include: {
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByToken(token: string) {
    return this.prisma.kiosk.findUnique({
      where: { token },
    });
  }
}