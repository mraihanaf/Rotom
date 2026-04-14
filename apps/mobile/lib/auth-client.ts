import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import {
  phoneNumberClient,
  adminClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

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
    inferAdditionalFields({
      user: {
        birthday: { type: 'date' },
        isProfileComplete: { type: 'boolean' },
      },
    }),
  ],
});

/**
 * Reads the session cookie from SecureStore and returns it as a
 * `{ cookie: "..." }` header object suitable for oRPC requests.
 *
 * Better Auth's expo client stores cookies as JSON in SecureStore, e.g.:
 *   {"better-auth.session_token": {"value": "abc", "expires": "2026-..."}}
 *
 * We must parse this into a proper HTTP Cookie header string:
 *   "better-auth.session_token=abc"
 */
export async function getAuthCookieHeader(): Promise<Record<string, string>> {
  const raw = await SecureStore.getItemAsync('rotom_cookie');
  if (!raw) return {};

  try {
    const parsed: Record<string, { value: string; expires: string | null }> =
      JSON.parse(raw);

    const cookieStr = Object.entries(parsed)
      .filter(([, entry]) => {
        // Skip expired cookies
        if (entry.expires && new Date(entry.expires) < new Date()) return false;
        return true;
      })
      .map(([name, entry]) => `${name}=${entry.value}`)
      .join('; ');

    if (!cookieStr) return {};
    return { cookie: cookieStr };
  } catch {
    // If parsing fails, return empty — don't send malformed headers
    return {};
  }
}
