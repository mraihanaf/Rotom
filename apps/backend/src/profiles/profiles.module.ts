import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService],
  imports: [PrismaModule, StorageModule, NotificationsModule],
  exports: [ProfilesService],
})
export class ProfilesModule {}
