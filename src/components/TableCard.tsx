import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { getTableCurrentTotal } from '../context/usePosStore';
import { colors, nunitoFontFamily, shape, spacing } from '../theme';
import { dashboardPalette } from '../theme/dashboardPalette';
import { Table } from '../types';
import { formatCurrency, formatElapsed } from '../utils/format';
import { AnimatedPressable } from './AnimatedPressable';

interface Props {
  table: Table;
  onPress: () => void;
  style?: ViewStyle;
}

// Semáforo de atenção: mesa parada há muito tempo vira prioridade visual.
function getStatusColor(minutes: number) {
  if (minutes >= 180) return dashboardPalette.rose;
  if (minutes >= 90) return dashboardPalette.amber;
  return dashboardPalette.teal500;
}

function getElapsedMinutes(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function TableCard({ table, onPress, style }: Props) {
  const total = getTableCurrentTotal(table);
  const itemCount = table.items.reduce((sum, i) => sum + i.quantity, 0);
  const minutes = getElapsedMinutes(table.openedAt);
  const accent = getStatusColor(minutes);

  return (
    <AnimatedPressable
      style={[styles.card, { backgroundColor: `${accent}0F`, borderColor: `${accent}4D` }, style]}
      stateLayerColor={accent}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.numBadge, { backgroundColor: accent }]}>
          <Text style={styles.numBadgeText} numberOfLines={1}>
            {table.label}
          </Text>
        </View>
        <View style={[styles.tempoPill, { backgroundColor: `${accent}24` }]}>
          <Ionicons name="time-outline" size={11} color={accent} />
          <Text style={[styles.tempoText, { color: accent }]}>{formatElapsed(table.openedAt)}</Text>
        </View>
      </View>

      <Text style={styles.total}>{formatCurrency(total)}</Text>
      <Text style={styles.metaText}>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: shape.medium,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.sm,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numBadge: {
    minWidth: 30,
    maxWidth: 90,
    height: 30,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 14,
    color: colors.white,
  },
  tempoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: shape.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tempoText: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 10.5,
  },
  total: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  metaText: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
