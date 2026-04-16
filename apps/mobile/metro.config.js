const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.resolver.unstable_enablePackageExports = true;

const BROKEN_EXPORTS_PACKAGES = [
  '@shopify/flash-list',
  '@react-native-community/netinfo',
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isBroken = BROKEN_EXPORTS_PACKAGES.some(
    (pkg) => moduleName === pkg || moduleName.startsWith(pkg + '/'),
  );
  if (isBroken) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform,
    );
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'node:module': path.resolve(projectRoot, 'shims/node-module.js'),
};

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineVariables: false,
  globalClassNamePolyfill: false,
});
