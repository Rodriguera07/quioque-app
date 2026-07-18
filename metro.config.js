const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Some packages (e.g. zustand) ship an ESM build with `import.meta`, which
// Metro's web bundler resolves via the "import" export condition and can't
// safely execute outside a module context. Preferring the package's
// "react-native" condition on every platform (including web) makes Metro
// resolve those packages to their CJS build instead, avoiding the crash.
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'import'];

module.exports = config;
