import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { betterAuth, BetterAuthPlugin } from 'better-auth';
import { PrismaService } from 'src/prisma/prisma.service';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthBaseConfig } from './auth.base';
import type { PrismaConfig } from 'better-auth/adapters/prisma';
import { PhoneNumberOptions } from 'better-auth/plugins';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly _instance: ReturnType<typeof betterAuth<any>>;

  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue('whatsapp') private readonly whatsappQueue: Queue,
  ) {
    const baseConfig: ReturnType<typeof createAuthBaseConfig> =
      createAuthBaseConfig({
        phoneNumber: {
          sendOTP: (params) => this.sendOtp(params),
          signUpOnVerification: {
            getTempEmail: (phoneNumber) => {
              return `${phoneNumber}@rotom.com`;
            },
          },
        },
      });

    this._instance = betterAuth({
      ...baseConfig,

      database: prismaAdapter(
        this.prismaService,
        baseConfig.database as PrismaConfig,
      ),
    });
  }

  get instance() {
    return this._instance;
  }

  get api() {
    return this._instance.api;
  }

  onModuleInit() {
    this.logger.log('Auth Service Started');
    this.logger.log(
      `Plugins loaded: ${this._instance.options.plugins?.map((p: BetterAuthPlugin) => p.id).join(', ')}`,
    );
  }

  async sendOtp({
    phoneNumber,
    code,
  }: Parameters<PhoneNumberOptions['sendOTP']>[0]): Promise<void> {
    await this.whatsappQueue.add('send-otp', {
      phoneNumber,
      code,
    });
  }
}
