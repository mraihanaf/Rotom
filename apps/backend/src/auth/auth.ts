import { betterAuth } from 'better-auth';
import { createAuthBaseConfig } from './auth.base';

type AuthConfig = ReturnType<typeof createAuthBaseConfig>;

export type AuthInstance = ReturnType<typeof betterAuth<AuthConfig>>;

let _auth: AuthInstance | null = null;

export function setAuthInstance(instance: AuthInstance) {
  _auth = instance;
}

export function getAuthInstance(): AuthInstance {
  if (!_auth) {
    throw new Error('Auth instance not initialized. Ensure AuthModule has been loaded.');
  }
  return _auth;
}
