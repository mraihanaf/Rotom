const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const backendSrc = path.resolve(monorepoRoot, 'apps/backend/src');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), backendSrc];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.unstable_enablePackageExports = true;

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'node:module': path.resolve(projectRoot, 'shims/node-module.js'),
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
});
