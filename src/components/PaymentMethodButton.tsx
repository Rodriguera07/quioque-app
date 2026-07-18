import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected?: boolean;
  onPress: () => void;
}

export function PaymentMethodButton({ label, icon, color, selected = false, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && { borderColor: color, backgroundColor: `${color}22` }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Ionicons name={icon} size={26} color={color} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
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
  },
  label: {
    ...typography.h3,
    color: colors.textPrimary,
  },
});
