import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { EmptyState } from '../components/EmptyState';
import { ReceiptTornEdge } from '../components/ReceiptTornEdge';
import { useAuthStore } from '../context/useAuthStore';
import { useClosedSalesRange } from '../hooks/useClosedSalesRange';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { RootStackParamList } from '../navigation/types';
import { colors, monoFontFamily, radius, spacing, typography } from '../theme';
import { PaymentMethod } from '../types';
import { formatCurrency, formatDateLabel } from '../utils/format';
import { getPeriodReport } from '../utils/reports';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type PeriodPreset = '7d' | '15d' | '30d' | 'custom';

const PRESETS: { key: PeriodPreset; label: string; days?: number }[] = [
  { key: '7d', label: 'Semanal', days: 7 },
  { key: '15d', label: 'Quinzenal', days: 15 },
  { key: '30d', label: 'Mensal', days: 30 },
  { key: 'custom', label: 'Personalizado' },
];

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; color: string }> = {
  pix: { label: 'PIX', color: colors.pix },
  dinheiro: { label: 'Dinheiro', color: colors.cash },
  debito: { label: 'Débito', color: colors.debit },
  credito: { label: 'Crédito', color: colors.credit },
};

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function formatShortRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const endLabel = end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  if (sameMonth) return `${start.getDate()} – ${endLabel}`;
  const startLabel = start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  return `${startLabel} – ${endLabel}`;
}

export function ReportsScreen({ navigation }: Props) {
  const orgId = useAuthStore((s) => s.user?.orgId ?? null);
  const { contentStyle } = useResponsiveContent();

  const [preset, setPreset] = useState<PeriodPreset>('7d');
  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  const range = useMemo(() => {
    if (preset === 'custom') return { start: startDate, end: endDate };
    const days = PRESETS.find((p) => p.key === preset)?.days ?? 7;
    return { start: subDays(new Date(), days - 1), end: new Date() };
  }, [preset, startDate, endDate]);

  const { sales } = useClosedSalesRange(orgId, range.start, range.end);

  const report = useMemo(() => getPeriodReport(sales, range.start, range.end), [sales, range]);

  const topMax = report.topItems[0]?.quantity ?? 1;
  const avgPerSale = report.salesCount > 0 ? report.totalRevenue / report.salesCount : 0;

  const handleSelectPreset = (key: PeriodPreset) => {
    setPreset(key);
  };

  const onChangeDate = (event: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!selected) return;
    if (pickerTarget === 'start') setStartDate(selected);
    if (pickerTarget === 'end') setEndDate(selected);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Relatórios</Text>
          <Text style={styles.subtitle}>{formatShortRange(range.start, range.end)}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <AnimatedPressable
            key={p.key}
            style={[styles.presetChip, preset === p.key && styles.presetChipActive]}
            onPress={() => handleSelectPreset(p.key)}
          >
            <Text style={[styles.presetText, preset === p.key && styles.presetTextActive]}>
              {p.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      {preset === 'custom' && (
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateField} onPress={() => setPickerTarget('start')}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={styles.dateFieldText}>{formatDateLabel(startDate.toISOString())}</Text>
          </TouchableOpacity>
          <Ionicons name="arrow-forward" size={13} color={colors.textMuted} />
          <TouchableOpacity style={styles.dateField} onPress={() => setPickerTarget('end')}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={styles.dateFieldText}>{formatDateLabel(endDate.toISOString())}</Text>
          </TouchableOpacity>
        </View>
      )}

      {pickerTarget && (
        <DateTimePicker
          value={pickerTarget === 'start' ? startDate : endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}

      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receipt}>
          <Text style={styles.receiptLabel}>FATURAMENTO DO PERÍODO</Text>
          <Text style={styles.receiptValue}>{formatCurrency(report.totalRevenue)}</Text>
          <View style={styles.receiptBadgeRow}>
            <Text style={styles.receiptBadgeText}>{report.salesCount} mesas fechadas</Text>
            <Text style={styles.receiptBadgeDot}>·</Text>
            <Text style={styles.receiptBadgeText}>{formatCurrency(avgPerSale)} por mesa</Text>
          </View>
        </View>
        <ReceiptTornEdge />

        <Text style={styles.sectionTitle}>Como o caixa entrou</Text>
        <View style={styles.stackedBar}>
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => {
            const amount = report.paymentBreakdown[method];
            const pct = report.totalRevenue > 0 ? (amount / report.totalRevenue) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <View
                key={method}
                style={{ flex: pct, backgroundColor: PAYMENT_LABELS[method].color }}
              />
            );
          })}
        </View>
        <View style={styles.paymentCard}>
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method, index, arr) => {
            const info = PAYMENT_LABELS[method];
            const amount = report.paymentBreakdown[method];
            const pct = report.totalRevenue > 0 ? Math.round((amount / report.totalRevenue) * 100) : 0;
            return (
              <View
                key={method}
                style={[styles.paymentRow, index === arr.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={[styles.paymentDot, { backgroundColor: info.color }]} />
                <Text style={styles.paymentLabel}>{info.label}</Text>
                <Text style={styles.paymentPct}>{pct}%</Text>
                <Text style={styles.paymentValue}>{formatCurrency(amount)}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Itens mais vendidos</Text>
        {report.topItems.length === 0 ? (
          <EmptyState icon="stats-chart-outline" title="Sem vendas no período" />
        ) : (
          <View style={styles.topItemsCard}>
            {report.topItems.map((item, index) => {
              const pct = Math.max(4, Math.round((item.quantity / topMax) * 100));
              return (
                <View key={item.menuItemId}>
                  <View style={styles.topItemTopLine}>
                    <Text style={styles.topItemRank}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.topItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.topItemRevenue}>{formatCurrency(item.revenue)}</Text>
                  </View>
                  <View style={styles.topItemBarTrack}>
                    <View style={[styles.topItemBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.topItemUnits}>{item.quantity} unidades</Text>
                </View>
              );
            })}
          </View>
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    color: colors.textMuted,
    marginTop: 1,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateFieldText: {
    ...typography.bodySm,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  receipt: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomWidth: 0,
    borderRadius: radius.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: spacing.lg,
  },
  receiptLabel: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  receiptValue: {
    ...typography.display,
    fontFamily: monoFontFamily,
    fontSize: 36,
    color: colors.emerald,
    marginTop: spacing.sm,
  },
  receiptBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  receiptBadgeText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  receiptBadgeDot: {
    color: colors.textMuted,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.sm,
    overflow: 'hidden',
    gap: 2,
  },
  paymentCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  paymentLabel: {
    ...typography.bodySm,
    color: colors.textPrimary,
    flex: 1,
  },
  paymentPct: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    color: colors.textMuted,
    width: 34,
    textAlign: 'right',
  },
  paymentValue: {
    ...typography.bodySm,
    fontFamily: monoFontFamily,
    color: colors.textPrimary,
    minWidth: 92,
    textAlign: 'right',
  },
  topItemsCard: {
    gap: spacing.md,
  },
  topItemTopLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: 7,
  },
  topItemRank: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    color: colors.sand,
  },
  topItemName: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  topItemRevenue: {
    ...typography.bodySm,
    fontFamily: monoFontFamily,
    color: colors.emerald,
  },
  topItemBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryMuted,
    overflow: 'hidden',
  },
  topItemBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.sand,
  },
  topItemUnits: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
});
