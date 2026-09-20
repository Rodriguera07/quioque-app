import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, elevation, shape, spacing } from '../theme';

type Variant = 'elevated' | 'filled' | 'outlined';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  variant?: Variant;
}

// Card no padrão Material 3: três variantes de superfície — Elevated (sombra,
// sem borda), Filled (fundo em camada, sem sombra/borda) e Outlined (fundo
// base, com contorno). Cantos em `shape.large`, como no M3.
export function Card({ children, style, variant = 'elevated' }: Props) {
  return <View style={[styles.base, variantStyles[variant], style]}>{children}</View>;
}

const variantStyles: Record<Variant, ViewStyle> = {
  elevated: {
    ...elevation(1),
    borderWidth: 0,
  },
  filled: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: shape.large,
    padding: spacing.md,
  },
});
