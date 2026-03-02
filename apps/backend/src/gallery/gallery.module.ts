import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService],
  imports: [PrismaModule, StorageModule],
})
export class GalleryModule {}
