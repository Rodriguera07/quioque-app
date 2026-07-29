import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, PressableProps, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { coloredShadow, colors, nunitoFontFamily, radius, spacing, typography } from '../theme';
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
        variantStyle.shadow,
        variantStyle.flatContainer,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...rest}
    >
      {variantStyle.gradient && (
        <LinearGradient
          colors={variantStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color as string} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, variantStyle.text, icon ? { marginLeft: spacing.xs } : null]}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

interface VariantStyle {
  gradient?: [string, string];
  flatContainer: ViewStyle;
  shadow: ViewStyle;
  text: { color: string };
}

const variantStyles: Record<Variant, VariantStyle> = {
  primary: {
    gradient: [colors.primary, '#0A7186'],
    flatContainer: {},
    shadow: coloredShadow(colors.primary),
    text: { color: colors.white },
  },
  emerald: {
    gradient: [colors.emerald, '#0B8871'],
    flatContainer: {},
    shadow: coloredShadow(colors.emerald),
    text: { color: colors.textInverse },
  },
  danger: {
    gradient: [colors.danger, '#C22E45'],
    flatContainer: {},
    shadow: coloredShadow(colors.danger),
    text: { color: colors.white },
  },
  outline: {
    flatContainer: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.borderLight,
    },
    shadow: {},
    text: { color: colors.textPrimary },
  },
  ghost: {
    flatContainer: { backgroundColor: colors.surfaceHighlight },
    shadow: {},
    text: { color: colors.textPrimary },
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: nunitoFontFamily.bold,
    letterSpacing: 0.2,
  },
});
