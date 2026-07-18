import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { PaymentMethod } from '../types';
import { formatCurrency, formatDateLabel, formatTime } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'EndDaySummary'>;

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  pix: { label: 'PIX', icon: 'qr-code-outline', color: colors.pix },
  dinheiro: { label: 'Dinheiro', icon: 'cash-outline', color: colors.cash },
  debito: { label: 'Débito', icon: 'card-outline', color: colors.debit },
  credito: { label: 'Crédito', icon: 'card', color: colors.credit },
};

export function EndDaySummaryScreen({ navigation, route }: Props) {
  const { summary } = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={40} color={colors.emerald} />
        </View>
        <Text style={styles.title}>Dia encerrado</Text>
        <Text style={styles.subtitle}>
          {formatDateLabel(summary.date + 'T00:00:00')} · fechado às {formatTime(summary.closedAt)}
        </Text>

        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Faturamento total</Text>
          <Text style={styles.revenueValue}>{formatCurrency(summary.totalRevenue)}</Text>
          <Text style={styles.revenueSub}>{summary.sales.length} mesa(s) atendida(s)</Text>
        </View>

        <Text style={styles.sectionTitle}>Formas de pagamento</Text>
        <View style={styles.paymentCard}>
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
            <View key={method} style={styles.paymentRow}>
              <Ionicons name={PAYMENT_LABELS[method].icon} size={18} color={PAYMENT_LABELS[method].color} />
              <Text style={styles.paymentLabel}>{PAYMENT_LABELS[method].label}</Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(summary.paymentBreakdown[method])}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Mesas do dia</Text>
        <View style={styles.salesCard}>
          {summary.sales.map((sale, index) => (
            <View
              key={sale.id}
              style={[styles.saleRow, index === summary.sales.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.saleLabel}>Mesa {sale.tableLabel}</Text>
                <Text style={styles.saleSub}>
                  {PAYMENT_LABELS[sale.paymentMethod].label} · {formatTime(sale.closedAt)}
                </Text>
              </View>
              <Text style={styles.saleValue}>{formatCurrency(sale.total)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Concluir e voltar ao painel"
          size="lg"
          variant="emerald"
          onPress={() => navigation.popToTop()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'stretch',
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  revenueCard: {
    backgroundColor: colors.emeraldMuted,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,230,160,0.25)',
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  revenueLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  revenueValue: {
    ...typography.display,
    color: colors.emerald,
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
  paymentLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  paymentValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  salesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saleLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  saleSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  saleValue: {
    ...typography.h3,
    color: colors.emerald,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
