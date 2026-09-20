// "Beach bar by day" theme: warm sand base with the same turquoise /
// sunset-coral / golden-sand accent family as the dark theme.
export const colors = {
  // Base — areia clara e neutra, tom exato do mock de referência do Dashboard
  background: '#F7F3EB',
  backgroundAlt: '#F1EAD7',
  surface: '#FFFDF7',
  surfaceElevated: '#FFFDF7',
  surfaceHighlight: '#FBF4E6',
  border: '#ECE0C7',
  borderLight: '#E3D6B4',

  // Marca — mar / turquesa
  primary: '#0D8FA6', // teal do oceano — interativo geral
  primaryMuted: '#E1F1F4',
  primaryGlow: 'rgba(13, 143, 166, 0.16)',

  emerald: '#0EA98D', // turquesa vivo — faturamento / positivo / sucesso
  emeraldMuted: '#DFF5F0',
  emeraldGlow: 'rgba(14, 169, 141, 0.16)',

  coral: '#E2603D', // laranja de pôr do sol — atenção / destaque quente
  coralMuted: '#FCEAE3',
  coralGlow: 'rgba(226, 96, 61, 0.16)',

  sand: '#B87A1E', // areia dourada — detalhes / dinheiro físico
  sandMuted: '#FBF0DC',
  sandGlow: 'rgba(184, 122, 30, 0.16)',

  // Semânticas
  success: '#0EA98D',
  danger: '#E1435C',
  dangerMuted: '#FCE7EA',
  warning: '#E2603D',
  warningMuted: '#FCEAE3',
  info: '#0D8FA6',

  // Texto
  textPrimary: '#2C2419',
  textSecondary: '#8B7E69',
  textMuted: '#B7A88C',
  textInverse: '#FFFFFF',

  // Formas de pagamento (cores distintas para facilitar leitura em gráficos)
  pix: '#0EA98D',
  cash: '#4C9A2A',
  debit: '#1D6FD1',
  credit: '#E2603D',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(20, 24, 28, 0.45)',

  // —— Papéis Material 3 (aliases sobre a paleta acima) ——
  // Mantém as cores da marca (praia/turquesa) mas nomeia os papéis do M3
  // (container/onContainer, superfícies em camadas, outline) para que os
  // componentes possam seguir o vocabulário do design system do Flutter.
  onPrimary: '#FFFFFF',
  primaryContainer: '#E1F1F4',
  onPrimaryContainer: '#063A44',

  onSecondary: '#FFFFFF',
  secondaryContainer: '#DFF5F0',
  onSecondaryContainer: '#04503F',

  tertiary: '#B87A1E',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FBF0DC',
  onTertiaryContainer: '#5C3B0E',

  errorContainer: '#FCE7EA',
  onErrorContainer: '#6B1626',

  onSurface: '#2C2419',
  onSurfaceVariant: '#8B7E69',
  outline: '#C9BC9E',
  outlineVariant: '#E3D6B4',

  // Superfícies em camadas: cada nível mistura um pouco mais do teal da
  // marca sobre a base "areia" — equivalente ao surface tint do M3, usado
  // para dar profundidade sem depender só de sombra.
  surfaceContainerLowest: '#FFFDF7',
  surfaceContainerLow: '#F7FAF5',
  surfaceContainer: '#EFF6F1',
  surfaceContainerHigh: '#E7F1ED',
  surfaceContainerHighest: '#DFEDE8',
} as const;

export type AppColors = typeof colors;
