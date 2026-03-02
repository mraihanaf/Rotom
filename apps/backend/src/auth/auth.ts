import { betterAuth } from 'better-auth';
import { prismaAdapter, PrismaConfig } from 'better-auth/adapters/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { createAuthBaseConfig } from './auth.base';

const prisma = new PrismaService();
const baseConfig = createAuthBaseConfig();

export const auth = betterAuth({
  ...baseConfig,
  database: prismaAdapter(prisma, baseConfig.database as PrismaConfig),
});
