import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ReferenceModule } from './reference/reference.module';
import { ConfigModule } from '@nestjs/config';
import { onError, ORPCModule } from '@orpc/nest';
import { REQUEST } from '@nestjs/core';
import { SmartCoercionPlugin } from '@orpc/json-schema';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { ProfilesModule } from './profiles/profiles.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FeaturesModule } from './features/features.module';
import { SubjectsModule } from './subjects/subjects.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GalleryModule } from './gallery/gallery.module';
import { DutiesModule } from './duties/duties.module';
import { FundsModule } from './funds/funds.module';
import { AssignmentsModule } from './assignments/assignments.module';
import type { AuthInstance } from './auth/auth';
import { StorageModule } from './storage/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { AnnouncementsModule } from './announcements/announcements.module';
import { OrganizationModule } from './organization/organization.module';
import { SchedulesModule } from './schedules/schedules.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';

declare module '@orpc/nest' {
  /**
   * Extend oRPC global context to make it type-safe inside your handlers/middlewares
   */
  interface ORPCGlobalContext {
    request: Request;
    session?: Awaited<ReturnType<AuthInstance['api']['getSession']>>;
  }
}

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ...(process.env.NODE_ENV === 'development' ? [ReferenceModule] : []),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({
        interceptors: [
          onError((error) => {
            new Logger('oRPC').error(error);
          }),
        ],
        context: {
          request,
        },
        eventIteratorKeepAliveInterval: 5000,
        customJsonSerializers: [],
        plugins: [
          new SmartCoercionPlugin({
            schemaConverters: [new ZodToJsonSchemaConverter()],
          }),
        ],
      }),
      inject: [REQUEST],
    }),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
      },
    }),

    ProfilesModule,

    DashboardModule,

    FeaturesModule,

    SubjectsModule,

    NotificationsModule,

    GalleryModule,

    DutiesModule,

    FundsModule,

    AssignmentsModule,

    StorageModule,

    OrganizationModule,

    AnnouncementsModule,

    SchedulesModule,

    SettingsModule,

    UsersModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [],
})
export class AppModule {}
