import { Platform, TextStyle } from 'react-native';

export const monoFontFamily = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

// Fraunces (serif) é usada só em pontos de destaque específicos (nome do
// usuário no Painel, valor do faturamento, número do ranking) — aplicada
// manualmente nesses estilos, não faz parte da escala tipográfica padrão.
export const serifFontFamily = {
  medium: 'Fraunces_500Medium',
  semiBold: 'Fraunces_600SemiBold',
  bold: 'Fraunces_700Bold',
};

// Nunito é a fonte padrão do corpo do app (ver `typography` abaixo). Usada
// também para sobrescrever pontualmente o peso de um texto que já herda um
// dos tokens de `typography` — nesses casos, sempre troque `fontWeight` por
// `fontFamily: nunitoFontFamily.x`, já que pesos de fontes estáticas
// customizadas não respondem a `fontWeight` numérico.
export const nunitoFontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
};

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

// Nunito é a fonte padrão de todo o app (mesma usada no Painel). Cada peso
// é um arquivo estático separado (ver nunitoFontFamily) — qualquer override
// pontual de ênfase precisa trocar `fontFamily`, não `fontWeight`.
export const typography: Record<TypeScale, TextStyle> = {
  display: { fontSize: 34, fontFamily: nunitoFontFamily.extraBold, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontFamily: nunitoFontFamily.bold, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontFamily: nunitoFontFamily.bold, letterSpacing: -0.2 },
  h3: { fontSize: 17, fontFamily: nunitoFontFamily.semiBold },
  bodyLg: { fontSize: 16, fontFamily: nunitoFontFamily.medium },
  body: { fontSize: 14, fontFamily: nunitoFontFamily.regular },
  bodySm: { fontSize: 13, fontFamily: nunitoFontFamily.regular },
  caption: { fontSize: 12, fontFamily: nunitoFontFamily.medium },
  label: { fontSize: 11, fontFamily: nunitoFontFamily.bold, letterSpacing: 0.6 },
  mono: { fontSize: 15, fontFamily: nunitoFontFamily.bold, letterSpacing: -0.2 },
};
