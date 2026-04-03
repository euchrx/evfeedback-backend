import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { KiosksModule } from '../kiosks/kiosks.module';

@Module({
  imports: [KiosksModule], // 👈 importante
  providers: [PublicService],
  controllers: [PublicController],
})
export class PublicModule {}