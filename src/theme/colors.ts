// "Beach bar at night" theme: deep ocean-night background, turquoise +
// sunset-coral accents, golden-sand details.
export const colors = {
  // Base — noite de praia (grafite azulado profundo)
  background: '#081119',
  backgroundAlt: '#0C1822',
  surface: '#101F2B',
  surfaceElevated: '#162A38',
  surfaceHighlight: '#1E3A49',
  border: '#1F3742',
  borderLight: '#2C4E5C',

  // Marca — mar / turquesa
  primary: '#22B8CF', // teal do oceano — interativo geral
  primaryMuted: '#123640',
  primaryGlow: 'rgba(34, 184, 207, 0.2)',

  emerald: '#2DD4BF', // turquesa vivo — faturamento / positivo / sucesso
  emeraldMuted: '#0F3A35',
  emeraldGlow: 'rgba(45, 212, 191, 0.2)',

  coral: '#FF8A5C', // laranja de pôr do sol — atenção / destaque quente
  coralMuted: '#3D2418',
  coralGlow: 'rgba(255, 138, 92, 0.2)',

  sand: '#E8C077', // areia dourada — detalhes / dinheiro físico
  sandMuted: '#3A3016',
  sandGlow: 'rgba(232, 192, 119, 0.18)',

  // Semânticas
  success: '#2DD4BF',
  danger: '#FF5C72',
  dangerMuted: '#3B1420',
  warning: '#FF8A5C',
  warningMuted: '#3D2418',
  info: '#22B8CF',

  // Texto
  textPrimary: '#F4F7F7',
  textSecondary: '#9BB2BD',
  textMuted: '#5B7581',
  textInverse: '#071219',

  // Formas de pagamento (cores distintas para facilitar leitura em gráficos)
  pix: '#2DD4BF',
  cash: '#8FD14F',
  debit: '#4FA8FF',
  credit: '#FF8A5C',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(4, 9, 12, 0.72)',
} as const;

export type AppColors = typeof colors;
