const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo (for packages/shared)
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from mobile's node_modules FIRST, then root
//    This prevents duplicate React instances
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Force these critical packages to resolve from mobile's node_modules only
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  "react-native-safe-area-context": path.resolve(projectRoot, "node_modules/react-native-safe-area-context"),
};

module.exports = config;
