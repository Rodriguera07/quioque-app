import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { getTableCurrentTotal } from '../context/usePosStore';
import { colors, monoFontFamily, radius, spacing, typography } from '../theme';
import { Table } from '../types';
import { formatCurrency, formatElapsed } from '../utils/format';
import { AnimatedPressable } from './AnimatedPressable';
import { TableTimeRing } from './TableTimeRing';

interface Props {
  table: Table;
  onPress: () => void;
  style?: ViewStyle;
}

const RING_MAX_MINUTES = 90;

function getUrgency(minutes: number) {
  if (minutes >= 60) return colors.danger;
  if (minutes >= 30) return colors.sand;
  return colors.emerald;
}

function getElapsedMinutes(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function TableCard({ table, onPress, style }: Props) {
  const total = getTableCurrentTotal(table);
  const itemCount = table.items.reduce((sum, i) => sum + i.quantity, 0);
  const minutes = getElapsedMinutes(table.openedAt);
  const accent = getUrgency(minutes);
  const progress = Math.min(1, minutes / RING_MAX_MINUTES);

  return (
    <AnimatedPressable style={[styles.card, { borderColor: accent }, style]} onPress={onPress}>
      <View style={styles.topRow}>
        <TableTimeRing progress={progress} color={accent}>
          <Text style={styles.ringLabel}>{table.label}</Text>
        </TableTimeRing>
        <View style={[styles.elapsedPill, { backgroundColor: `${accent}26` }]}>
          <Text style={[styles.elapsed, { color: accent }]}>{formatElapsed(table.openedAt)}</Text>
        </View>
      </View>

      <Text style={styles.total}>{formatCurrency(total)}</Text>
      <Text style={styles.metaText}>{itemCount} itens</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  elapsedPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  elapsed: {
    ...typography.caption,
    fontFamily: monoFontFamily,
  },
  total: {
    ...typography.h3,
    fontFamily: monoFontFamily,
    color: colors.emerald,
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
