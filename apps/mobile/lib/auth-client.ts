import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { phoneNumberClient, adminClient } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://10.4.6.229:3000';

export const authClient = createAuthClient({
  baseURL: `${API_URL}/auth`,
  plugins: [
    expoClient({
      scheme: 'minimal',
      storagePrefix: 'rotom',
      storage: SecureStore,
    }),
    phoneNumberClient(),
    adminClient(),
  ],
});

export async function getAuthCookieHeader(): Promise<Record<string, string>> {
  const raw = await SecureStore.getItemAsync('rotom_cookie');
  if (!raw) return {};
  return { cookie: raw };
}
