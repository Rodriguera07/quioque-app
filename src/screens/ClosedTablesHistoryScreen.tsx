import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../context/useAuthStore';
import { useClosedSalesRange } from '../hooks/useClosedSalesRange';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { RootStackParamList } from '../navigation/types';
import { colors, monoFontFamily, radius, spacing, typography } from '../theme';
import { ClosedSale } from '../types';
import { formatCurrency, formatDateLabel, formatTime } from '../utils/format';
import { describeSalePayments } from '../utils/payments';

type Props = NativeStackScreenProps<RootStackParamList, 'ClosedTablesHistory'>;

type PeriodPreset = '7d' | '30d' | '90d';

const PRESETS: { key: PeriodPreset; label: string; days: number }[] = [
  { key: '7d', label: '7 dias', days: 7 },
  { key: '30d', label: '30 dias', days: 30 },
  { key: '90d', label: '90 dias', days: 90 },
];

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

// Agrupa as vendas por dia (rótulo "22/07/2026") mantendo a ordem
// cronológica decrescente já entregue pela query.
function groupByDay(sales: ClosedSale[]): { label: string; sales: ClosedSale[] }[] {
  const groups: { label: string; sales: ClosedSale[] }[] = [];
  sales.forEach((sale) => {
    const label = formatDateLabel(sale.closedAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.sales.push(sale);
    } else {
      groups.push({ label, sales: [sale] });
    }
  });
  return groups;
}

export function ClosedTablesHistoryScreen({ navigation }: Props) {
  const orgId = useAuthStore((s) => s.user?.orgId ?? null);
  const { contentStyle } = useResponsiveContent();
  const [preset, setPreset] = useState<PeriodPreset>('7d');

  const days = PRESETS.find((p) => p.key === preset)?.days ?? 7;
  const range = useMemo(() => ({ start: subDays(new Date(), days - 1), end: new Date() }), [days]);

  const { sales, loading } = useClosedSalesRange(orgId, range.start, range.end);
  const groups = useMemo(() => groupByDay(sales), [sales]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Histórico de Mesas</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <AnimatedPressable
            key={p.key}
            style={[styles.presetChip, preset === p.key && styles.presetChipActive]}
            onPress={() => setPreset(p.key)}
          >
            <Text style={[styles.presetText, preset === p.key && styles.presetTextActive]}>
              {p.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {!loading && sales.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Nenhuma mesa fechada no período"
            subtitle="Tente um período maior para ver mesas anteriores."
          />
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.card}>
                {group.sales.map((sale, index) => (
                  <TouchableOpacity
                    key={sale.id}
                    style={[
                      styles.row,
                      index === group.sales.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => navigation.navigate('ClosedTableDetail', { sale })}
                  >
                    <View style={styles.rowIcon}>
                      <Ionicons name="receipt-outline" size={17} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>Mesa {sale.tableLabel}</Text>
                      <Text style={styles.rowSub}>
                        {formatTime(sale.closedAt)} · {describeSalePayments(sale.payments)}
                        {sale.closedByUserName ? ` · ${sale.closedByUserName}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.rowValue}>{formatCurrency(sale.total)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.sand,
    borderColor: colors.sand,
  },
  presetText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  group: {
    marginBottom: spacing.md,
  },
  groupLabel: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  rowValue: {
    ...typography.bodySm,
    fontFamily: monoFontFamily,
    color: colors.emerald,
  },
});
