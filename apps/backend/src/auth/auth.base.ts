import { BetterAuthOptions } from 'better-auth';
import { admin, phoneNumber } from 'better-auth/plugins';
import { openAPI } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';

type AuthBaseOverrides = {
  phoneNumber?: Parameters<typeof phoneNumber>[0];
  admin?: Parameters<typeof admin>[0];
};

export function createAuthBaseConfig(overrides?: AuthBaseOverrides) {
  return {
    database: {
      provider: 'sqlite',
    },
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    basePath: '/auth',

    trustedOrigins: [
      'minimal://',
      'exp://*',
      'https://*.exp.direct',
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') || []),
    ],

    user: {
      additionalFields: {
        birthday: {
          type: 'date',
        },
        isProfileComplete: {
          type: 'boolean',
          defaultValue: false,
        },
      },
    },

    emailAndPassword: {
      enabled: false,
    },

    plugins: [
      phoneNumber(overrides?.phoneNumber),
      admin(overrides?.admin),
      expo(),
      ...(process.env.NODE_ENV === 'development' ? [openAPI()] : []),
    ],
  } satisfies BetterAuthOptions;
}
