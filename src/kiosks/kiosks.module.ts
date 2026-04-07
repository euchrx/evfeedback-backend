import { Module } from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { KiosksController } from './kiosks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KiosksController],
  providers: [KiosksService],
  exports: [KiosksService],
})
export class KiosksModule {}