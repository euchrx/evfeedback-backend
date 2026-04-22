import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { KiosksModule } from './kiosks/kiosks.module';
import { PublicModule } from './public/public.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { TagsModule } from './tags/tags.module';
import { SettingsModule } from './settings/settings.module';
import { CompaniesModule } from './companies/companies.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    BranchesModule,
    KiosksModule,
    PublicModule,
    DashboardModule,
    FeedbacksModule,
    TagsModule,
    SettingsModule,
    NotificationsModule,
  ],
})
export class AppModule {}