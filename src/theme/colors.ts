export const colors = {
  // Base — grafite escuro (fintech dark)
  background: '#0A0D12',
  backgroundAlt: '#0F1319',
  surface: '#151A22',
  surfaceElevated: '#1C222D',
  surfaceHighlight: '#232A37',
  border: '#262E3B',
  borderLight: '#323C4C',

  // Marca
  primary: '#3D8BFF', // azul neon
  primaryMuted: '#1E3A5F',
  primaryGlow: 'rgba(61, 139, 255, 0.18)',

  emerald: '#00E6A0', // verde esmeralda — faturamento / positivo
  emeraldMuted: '#0D3B2E',
  emeraldGlow: 'rgba(0, 230, 160, 0.16)',

  // Semânticas
  success: '#00E6A0',
  danger: '#FF5C72',
  dangerMuted: '#3B1420',
  warning: '#FFB020',
  warningMuted: '#3D2C0A',
  info: '#3D8BFF',

  // Texto
  textPrimary: '#F5F7FA',
  textSecondary: '#9AA4B8',
  textMuted: '#5E6779',
  textInverse: '#0A0D12',

  // Formas de pagamento
  pix: '#00E6A0',
  cash: '#FFB020',
  debit: '#3D8BFF',
  credit: '#C084FC',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(4, 6, 10, 0.72)',
} as const;

export type AppColors = typeof colors;
