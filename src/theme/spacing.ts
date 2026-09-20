export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

// Escala de forma do Material 3, mapeada sobre os mesmos valores de `radius`
// — usar esses nomes em componentes que seguem o padrão M3 (botões, cards,
// chips, FAB) deixa explícito qual papel de forma está sendo aplicado.
export const shape = {
  none: 0,
  extraSmall: radius.sm,
  small: 10,
  medium: radius.md,
  large: radius.lg,
  extraLarge: radius.xxl,
  full: radius.full,
} as const;
