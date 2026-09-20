import React from 'react';
import { ActivityIndicator, PressableProps, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, elevationShadow, nunitoFontFamily, shape, spacing, typography } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

type Variant = 'primary' | 'emerald' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface Props extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

// Botões no padrão Material 3: forma "full" (pílula) por padrão, cor sólida
// em vez de gradiente, e camada de estado (ripple/fade) ao toque em vez de
// só a escala. `variant` mapeia para os papéis do M3 — Filled (primary /
// emerald / danger), Outlined e Filled tonal (ghost).
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = true,
  style,
  disabled,
  ...rest
}: Props) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      disabled={isDisabled}
      scaleTo={0.98}
      stateLayerColor={v.stateLayer}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        v.shadow,
        v.container,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color as string} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, v.text, icon ? { marginLeft: spacing.xs } : null]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

interface VariantStyle {
  container: ViewStyle;
  shadow: ViewStyle;
  text: { color: string };
  stateLayer: string;
}

const variantStyles: Record<Variant, VariantStyle> = {
  primary: {
    container: { backgroundColor: colors.primary },
    shadow: elevationShadow(1),
    text: { color: colors.onPrimary },
    stateLayer: colors.onPrimary,
  },
  emerald: {
    container: { backgroundColor: colors.emerald },
    shadow: elevationShadow(1),
    text: { color: colors.onSecondary },
    stateLayer: colors.onSecondary,
  },
  danger: {
    container: { backgroundColor: colors.danger },
    shadow: elevationShadow(1),
    text: { color: colors.white },
    stateLayer: colors.white,
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.outline,
    },
    shadow: {},
    text: { color: colors.primary },
    stateLayer: colors.primary,
  },
  ghost: {
    container: { backgroundColor: colors.surfaceContainerHighest },
    shadow: {},
    text: { color: colors.onSurface },
    stateLayer: colors.onSurface,
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.full,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    ...typography.h3,
    fontFamily: nunitoFontFamily.bold,
    letterSpacing: 0.2,
  },
});
