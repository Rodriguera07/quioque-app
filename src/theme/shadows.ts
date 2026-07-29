import { ViewStyle } from 'react-native';
import { colors } from './colors';

// Escala de elevação neutra (sombra escura, suave) — para superfícies que só
// precisam de profundidade, sem cor de marca (cards, painéis).
export const shadows: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  md: {
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  lg: {
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

// Sombra "colorida" (glow) — usada em botões e elementos de destaque para a
// sombra reforçar a cor do próprio elemento em vez de ficar neutra/cinza.
export function coloredShadow(color: string, intensity: 'sm' | 'md' = 'md'): ViewStyle {
  return intensity === 'sm'
    ? {
        shadowColor: color,
        shadowOpacity: 0.28,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }
    : {
        shadowColor: color,
        shadowOpacity: 0.38,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      };
}
