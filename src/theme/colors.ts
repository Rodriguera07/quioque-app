// "Beach bar by day" theme: warm sand base with the same turquoise /
// sunset-coral / golden-sand accent family as the dark theme.
export const colors = {
  // Base — areia quente (bege claro, em vez do cinza frio anterior)
  background: '#F1E8D4',
  backgroundAlt: '#E8DCBE',
  surface: '#FFFDF8',
  surfaceElevated: '#FFFDF8',
  surfaceHighlight: '#F3ECDA',
  border: '#E6DBBF',
  borderLight: '#DCCEA8',

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
  textPrimary: '#211D14',
  textSecondary: '#635B48',
  textMuted: '#948B72',
  textInverse: '#FFFFFF',

  // Formas de pagamento (cores distintas para facilitar leitura em gráficos)
  pix: '#0EA98D',
  cash: '#4C9A2A',
  debit: '#1D6FD1',
  credit: '#E2603D',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(20, 24, 28, 0.45)',
} as const;

export type AppColors = typeof colors;
