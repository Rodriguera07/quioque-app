const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand ships an ESM build with `import.meta`, which Metro's web bundler
// resolves via the "import" export condition and can't safely execute
// outside a module context. Forcing its "react-native" (CJS) condition
// avoids that crash.
//
// This used to be applied globally (every package, every platform), but that
// also makes Metro resolve `firebase/auth` to its React Native build on web —
// which throws right after sign-in (`_fromIdTokenResponse` calls into
// RN-only internals that don't exist in a browser). Scoping the override to
// zustand only keeps every other package, including firebase, on Metro's
// normal per-platform resolution.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['react-native', 'require'] },
      moduleName,
      platform
    );
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
