import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiosksService } from '../kiosks/kiosks.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kiosksService: KiosksService,
  ) {}
}