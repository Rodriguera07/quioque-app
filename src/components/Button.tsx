import React from 'react';
import { ActivityIndicator, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
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
  const variantStyle = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      disabled={isDisabled}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color as string} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, variantStyle.text, icon ? { marginLeft: spacing.xs } : null]}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const variantStyles: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    text: { color: colors.white },
  },
  emerald: {
    container: {
      backgroundColor: colors.emerald,
      shadowColor: colors.emerald,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    text: { color: colors.textInverse },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.borderLight,
    },
    text: { color: colors.textPrimary },
  },
  ghost: {
    container: { backgroundColor: colors.surfaceElevated },
    text: { color: colors.textPrimary },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: colors.white },
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    ...typography.h3,
  },
});
