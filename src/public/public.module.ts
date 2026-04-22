import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../prisma/prisma.module';
import { KiosksModule } from '../kiosks/kiosks.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, KiosksModule, SettingsModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}