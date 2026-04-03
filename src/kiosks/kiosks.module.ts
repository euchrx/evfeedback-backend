import { Module } from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { KiosksController } from './kiosks.controller';

@Module({
  controllers: [KiosksController],
  providers: [KiosksService],
  exports: [KiosksService],
})
export class KiosksModule {}