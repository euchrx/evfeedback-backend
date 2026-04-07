import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../prisma/prisma.module';
import { KiosksModule } from '../kiosks/kiosks.module';

@Module({
  imports: [PrismaModule, KiosksModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}