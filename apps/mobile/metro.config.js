const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add support for workspace packages
config.watchFolders = [
  `${__dirname}/../../packages/types`,
  `${__dirname}/../../packages/api-client`,
];

config.resolver.nodeModulesPaths = [
  `${__dirname}/node_modules`,
  `${__dirname}/../../node_modules`,
];

module.exports = withNativeWind(config, { input: './global.css' });
