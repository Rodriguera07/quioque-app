import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { coloredShadow, colors, nunitoFontFamily, radius, spacing, typography } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function PaymentMethodButton({
  label,
  icon,
  color,
  selected = false,
  onPress,
  style,
}: Props) {
  return (
    <AnimatedPressable
      style={[styles.card, style, selected && [styles.cardSelected, { borderColor: color }, coloredShadow(color)]]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}1F` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.label, selected && { color }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardSelected: {
    backgroundColor: colors.surfaceElevated,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.h3,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textPrimary,
  },
});
