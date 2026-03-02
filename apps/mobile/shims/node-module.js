// Shim for `node:module` imported by @better-auth/expo's rolldown runtime artifact.
// createRequire is never actually called in the React Native client bundle.
export function createRequire() {
  return function () {
    throw new Error('createRequire is not available in React Native');
  };
}
