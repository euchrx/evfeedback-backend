import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { KiosksModule } from './kiosks/kiosks.module';
import { PublicModule } from './public/public.module';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { TagsModule } from './tags/tags.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    KiosksModule,
    PublicModule,
    DashboardModule,
    FeedbacksModule,
    TagsModule,
    SettingsModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class AppModule {}