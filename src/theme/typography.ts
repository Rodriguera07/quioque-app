import { Platform, TextStyle } from 'react-native';

export const monoFontFamily = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

type TypeScale =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'label'
  | 'mono';

export const typography: Record<TypeScale, TextStyle> = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: '600' },
  bodyLg: { fontSize: 16, fontWeight: '500' },
  body: { fontSize: 14, fontWeight: '400' },
  bodySm: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  mono: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
};
