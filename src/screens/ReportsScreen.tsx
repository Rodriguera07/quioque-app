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
        <Text style={styles.title}>Relatórios</Text>
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
          <Text style={styles.dateSeparator}>até</Text>
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
          <Text style={styles.revenueLabel}>Faturamento do período</Text>
          <Text style={styles.revenueValue}>{formatCurrency(report.totalRevenue)}</Text>
          <Text style={styles.revenueSub}>{report.salesCount} mesa(s) fechada(s)</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Formas de pagamento</Text>
        <View style={styles.paymentCard}>
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
            <View key={method} style={styles.paymentRow}>
              <View style={[styles.paymentDot, { backgroundColor: PAYMENT_LABELS[method].color }]} />
              <Text style={styles.paymentLabel}>{PAYMENT_LABELS[method].label}</Text>
              <Text style={styles.paymentValue}>{formatCurrency(report.paymentBreakdown[method])}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Itens mais vendidos</Text>
        {report.topItems.length === 0 ? (
          <EmptyState icon="stats-chart-outline" title="Sem vendas no período" />
        ) : (
          <View style={styles.topItemsCard}>
            {report.topItems.map((item, index) => (
              <View
                key={item.menuItemId}
                style={[
                  styles.topItemRow,
                  index === report.topItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.topItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.topItemQty}>{item.quantity}x</Text>
              </View>
            ))}
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  presetText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.primary,
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
  dateSeparator: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  revenueCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,230,160,0.25)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  revenueLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  revenueValue: {
    ...typography.display,
    color: colors.emerald,
    textShadowColor: colors.emeraldGlow,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
    marginTop: spacing.xxs,
  },
  revenueSub: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
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
    gap: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  paymentLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  paymentValue: {
    ...typography.h3,
    color: colors.textPrimary,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.caption,
    color: colors.primary,
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
