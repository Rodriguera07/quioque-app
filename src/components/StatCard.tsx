import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: string;
  accentGlow?: string;
  highlight?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  accent = colors.primary,
  accentGlow = colors.primaryGlow,
  highlight = false,
}: Props) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: highlight ? 'rgba(255,255,255,0.12)' : accentGlow }]}>
        <Ionicons name={icon} size={18} color={highlight ? colors.emerald : accent} />
      </View>
      <Text
        style={[styles.value, highlight && styles.valueHighlight]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.label, highlight && styles.labelHighlight]}>{label}</Text>
    </>
  );

  if (highlight) {
    return (
      <LinearGradient
        colors={[colors.emeraldMuted, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.cardHighlight]}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 108,
    justifyContent: 'space-between',
  },
  cardHighlight: {
    borderColor: colors.emeraldGlow,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  valueHighlight: {
    color: colors.emerald,
    textShadowColor: colors.emeraldGlow,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelHighlight: {
    color: colors.textSecondary,
  },
});
