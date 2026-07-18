import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { EmptyState } from '../components/EmptyState';
import { usePosStore } from '../context/usePosStore';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { PaymentMethod } from '../types';
import { formatCurrency, formatDateLabel } from '../utils/format';
import { getAllSales, getPeriodReport } from '../utils/reports';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type PeriodPreset = '7d' | '15d' | '30d' | 'custom';

const PRESETS: { key: PeriodPreset; label: string; days?: number }[] = [
  { key: '7d', label: 'Semanal', days: 7 },
  { key: '15d', label: 'Quinzenal', days: 15 },
  { key: '30d', label: 'Mensal', days: 30 },
  { key: 'custom', label: 'Personalizado' },
];

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; color: string; muted: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pix: { label: 'PIX', color: colors.pix, muted: colors.emeraldMuted, icon: 'flash-outline' },
  dinheiro: { label: 'Dinheiro', color: colors.cash, muted: colors.sandMuted, icon: 'cash-outline' },
  debito: { label: 'Débito', color: colors.debit, muted: colors.primaryMuted, icon: 'card-outline' },
  credito: { label: 'Crédito', color: colors.credit, muted: colors.coralMuted, icon: 'card' },
};

const RANK_STYLES = [
  { bg: colors.sandMuted, text: colors.sand },
  { bg: 'rgba(155, 178, 189, 0.16)', text: colors.textSecondary },
  { bg: colors.coralMuted, text: colors.coral },
];

function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function ReportsScreen({ navigation }: Props) {
  const history = usePosStore((s) => s.history);
  const closedSalesToday = usePosStore((s) => s.closedSalesToday);

  const [preset, setPreset] = useState<PeriodPreset>('7d');
  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  const allSales = useMemo(() => getAllSales(history, closedSalesToday), [history, closedSalesToday]);

  const range = useMemo(() => {
    if (preset === 'custom') return { start: startDate, end: endDate };
    const days = PRESETS.find((p) => p.key === preset)?.days ?? 7;
    return { start: subDays(new Date(), days - 1), end: new Date() };
  }, [preset, startDate, endDate]);

  const report = useMemo(
    () => getPeriodReport(allSales, range.start, range.end),
    [allSales, range]
  );

  const periodLabel = useMemo(() => {
    const days = PRESETS.find((p) => p.key === preset)?.days;
    if (days) return `Últimos ${days} dias`;
    return `${formatDateLabel(range.start.toISOString())} até ${formatDateLabel(range.end.toISOString())}`;
  }, [preset, range]);

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
          <Text style={styles.subtitle}>Desempenho de vendas</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.presetRow}>
        {PRESETS.map((p) =>
          preset === p.key ? (
            <AnimatedPressable key={p.key} style={styles.presetChipWrap} onPress={() => handleSelectPreset(p.key)}>
              <LinearGradient
                colors={[colors.emerald, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.presetChipActive}
              >
                <Text style={styles.presetTextActive}>{p.label}</Text>
              </LinearGradient>
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              key={p.key}
              style={[styles.presetChipWrap, styles.presetChip]}
              onPress={() => handleSelectPreset(p.key)}
            >
              <Text style={styles.presetText}>{p.label}</Text>
            </AnimatedPressable>
          )
        )}
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.emeraldMuted, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.revenueCard}
        >
          <View style={styles.revenueTopRow}>
            <View>
              <Text style={styles.revenueLabel}>Faturamento do período</Text>
              <Text style={styles.revenuePeriod}>{periodLabel}</Text>
            </View>
            <View style={styles.revenueIconWrap}>
              <Ionicons name="trending-up-outline" size={20} color={colors.emerald} />
            </View>
          </View>
          <Text style={styles.revenueValue}>{formatCurrency(report.totalRevenue)}</Text>
          <View style={styles.revenueBadge}>
            <Ionicons name="receipt-outline" size={13} color={colors.textMuted} />
            <Text style={styles.revenueSub}>{report.salesCount} mesa(s) fechada(s)</Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Formas de pagamento</Text>
        <View style={styles.paymentCard}>
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method, index, arr) => {
            const info = PAYMENT_LABELS[method];
            const amount = report.paymentBreakdown[method];
            const pct = report.totalRevenue > 0 ? Math.round((amount / report.totalRevenue) * 100) : 0;
            return (
              <View
                key={method}
                style={[styles.paymentRow, index === arr.length - 1 && { marginBottom: 0 }]}
              >
                <View style={styles.paymentRowTop}>
                  <View style={styles.paymentLabelWrap}>
                    <View style={[styles.paymentIconWrap, { backgroundColor: info.muted }]}>
                      <Ionicons name={info.icon} size={13} color={info.color} />
                    </View>
                    <Text style={styles.paymentLabel}>{info.label}</Text>
                  </View>
                  <View style={styles.paymentValueWrap}>
                    <Text style={styles.paymentValue}>{formatCurrency(amount)}</Text>
                    <Text style={styles.paymentPct}>{pct}%</Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: info.color }]} />
                </View>
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
              const rank = RANK_STYLES[index] ?? RANK_STYLES[2];
              return (
                <View
                  key={item.menuItemId}
                  style={[
                    styles.topItemRow,
                    index === report.topItems.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
                    <Text style={[styles.rankText, { color: rank.text }]}>{index + 1}</Text>
                  </View>
                  <Text style={styles.topItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.topItemQty}>{item.quantity}x</Text>
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
    color: colors.textMuted,
    marginTop: 1,
  },
  presetRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChipWrap: {
    flex: 1,
    borderRadius: radius.full,
  },
  presetChip: {
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetChipActive: {
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  presetText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  presetTextActive: {
    ...typography.caption,
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
  revenueCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.emeraldGlow,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  revenueTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  revenueIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  revenuePeriod: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 1,
  },
  revenueValue: {
    ...typography.display,
    color: colors.emerald,
    textShadowColor: colors.emeraldGlow,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
    marginTop: spacing.sm,
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xs,
  },
  revenueSub: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  paymentRow: {
    marginBottom: spacing.md,
  },
  paymentRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  paymentLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentIconWrap: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  paymentValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  paymentValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  paymentPct: {
    ...typography.caption,
    color: colors.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  topItemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.caption,
    fontWeight: '700',
  },
  topItemName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  topItemQty: {
    ...typography.h3,
    color: colors.emerald,
  },
});
