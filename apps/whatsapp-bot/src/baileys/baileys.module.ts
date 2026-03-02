import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BaileysService } from './baileys.service';
import { BullModule } from '@nestjs/bullmq';
import { BaileysProcessor } from './baileys.processor';

@Module({
  imports: [
    DiscoveryModule,
    BullModule.registerQueue({
      name: 'whatsapp',
    }),
  ],
  providers: [BaileysService, BaileysProcessor],
  exports: [BaileysService, BaileysProcessor],
})
export class BaileysModule {}
