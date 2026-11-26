const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch only shared packages and root node_modules for faster bundling
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Exclude transient pnpm task lock directories and build artifacts
config.resolver.blockList = [
  /.*\.pnpm-task-run-state.*/,
  /.*[\\/]apps[\\/]api[\\/]dist[\\/].*/,
  /.*[\\/]android[\\/]\.gradle[\\/].*/,
  /.*[\\/]android[\\/]build[\\/].*/,
];

// Resolve packages from the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
