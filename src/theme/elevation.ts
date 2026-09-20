import { ViewStyle } from 'react-native';
import { colors } from './colors';

// Elevação no Material 3: cada nível combina uma sombra neutra suave com uma
// superfície ligeiramente mais "tingida" da cor da marca (surface tint) —
// por isso um card elevado no M3 não fica só com sombra mais forte, ele fica
// com o fundo um tom mais escuro/saturado também.
export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

const SURFACE_BY_LEVEL: Record<ElevationLevel, string> = {
  0: colors.surfaceContainerLowest,
  1: colors.surfaceContainerLow,
  2: colors.surfaceContainer,
  3: colors.surfaceContainerHigh,
  4: colors.surfaceContainerHigh,
  5: colors.surfaceContainerHighest,
};

const SHADOW_BY_LEVEL: Record<ElevationLevel, ViewStyle> = {
  0: {},
  1: {
    shadowColor: colors.onSurface,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  2: {
    shadowColor: colors.onSurface,
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  3: {
    shadowColor: colors.onSurface,
    shadowOpacity: 0.11,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  4: {
    shadowColor: colors.onSurface,
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  5: {
    shadowColor: colors.onSurface,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
};

// Sombra + superfície tingida para o nível pedido, pronta para spread num
// StyleSheet (`...elevation(2)`).
export function elevation(level: ElevationLevel): ViewStyle {
  return { backgroundColor: SURFACE_BY_LEVEL[level], ...SHADOW_BY_LEVEL[level] };
}

// Só a sombra, sem a superfície — útil quando o fundo já tem cor própria
// (ex.: um card com gradiente) mas ainda precisa da profundidade do M3.
export function elevationShadow(level: ElevationLevel): ViewStyle {
  return SHADOW_BY_LEVEL[level];
}

export const elevationSurface = SURFACE_BY_LEVEL;

// Camada de estado (hover/press/focus) do M3: um overlay translúcido da cor
// de conteúdo sobre o elemento, na opacidade padrão de cada interação.
export const stateLayerOpacity = {
  hover: 0.08,
  focus: 0.1,
  press: 0.1,
  drag: 0.16,
} as const;
