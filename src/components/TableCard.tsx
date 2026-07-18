import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getTableCurrentTotal } from '../context/usePosStore';
import { colors, radius, spacing, typography } from '../theme';
import { Table } from '../types';
import { formatCurrency, formatTime } from '../utils/format';
import { AnimatedPressable } from './AnimatedPressable';
import { PulseDot } from './PulseDot';

interface Props {
  table: Table;
  onPress: () => void;
}

export function TableCard({ table, onPress }: Props) {
  const total = getTableCurrentTotal(table);
  const itemCount = table.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AnimatedPressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{table.label}</Text>
        </View>
        <PulseDot />
      </View>

      <Text style={styles.total}>{formatCurrency(total)}</Text>

      <View style={styles.metaRow}>
        <Ionicons name="fast-food-outline" size={13} color={colors.textMuted} />
        <Text style={styles.metaText}>{itemCount} itens</Text>
      </View>

      <View style={styles.footerRow}>
        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
        <Text style={styles.footerText}>{formatTime(table.openedAt)}</Text>
        {table.waiterName ? (
          <>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.footerText} numberOfLines={1}>
              {table.waiterName}
            </Text>
          </>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  total: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
  dot: {
    color: colors.textMuted,
  },
});
