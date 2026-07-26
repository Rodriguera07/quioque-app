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

// Idem, para o corpo em Nunito usado especificamente no Painel (ver
// DashboardScreen) — não é a fonte padrão do resto do app (ver comentário
// abaixo em `typography`).
export const nunitoFontFamily = {
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

// Mantém a fonte padrão do sistema na escala global: muitos estilos pelo
// app combinam esses tokens com um `fontWeight` próprio por cima (ex.:
// `{...typography.bodySm, fontWeight: '700'}`), o que não funciona com
// fontes customizadas estáticas (cada peso é um arquivo .ttf separado, e o
// SO ignora `fontWeight` numérico nesse caso). Nunito/Fraunces são usadas
// só nos pontos específicos do Painel que pedem esse visual (ver
// DashboardScreen), setando `fontFamily` explicitamente ali.
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
