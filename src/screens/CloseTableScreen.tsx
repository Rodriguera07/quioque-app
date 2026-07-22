import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentMethodButton } from '../components/PaymentMethodButton';
import {
  getNextPaymentAmount,
  getPaidPeopleCount,
  getPaidTotal,
  getRemainingAmount,
  PAID_EPSILON,
  SERVICE_FEE_RATE,
  usePosStore,
} from '../context/usePosStore';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { PaymentMethod } from '../types';
import { showAlert } from '../utils/alert';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'CloseTable'>;

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { method: 'pix', label: 'PIX', icon: 'qr-code-outline', color: colors.pix },
  { method: 'dinheiro', label: 'Dinheiro', icon: 'cash-outline', color: colors.cash },
  { method: 'debito', label: 'Débito', icon: 'card-outline', color: colors.debit },
  { method: 'credito', label: 'Crédito', icon: 'card', color: colors.credit },
];

const METHOD_META: Record<PaymentMethod, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  pix: { icon: 'qr-code-outline', color: colors.pix },
  dinheiro: { icon: 'cash-outline', color: colors.cash },
  debito: { icon: 'card-outline', color: colors.debit },
  credito: { icon: 'card', color: colors.credit },
};

export function CloseTableScreen({ navigation, route }: Props) {
  const { tableId } = route.params;
  const table = usePosStore((s) => s.tables.find((t) => t.id === tableId));
  const recordPayment = usePosStore((s) => s.recordPayment);
  const closeTable = usePosStore((s) => s.closeTable);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!table) return null;

  const subtotal = table.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const serviceFeeAmount = table.serviceFeeEnabled ? subtotal * SERVICE_FEE_RATE : 0;
  const total = subtotal + serviceFeeAmount;

  const isSplit = table.splitEnabled;
  const paidCount = getPaidPeopleCount(table);
  const paidTotal = getPaidTotal(table);
  const remaining = getRemainingAmount(table);
  const nextAmount = getNextPaymentAmount(table);
  const currentPersonNumber = Math.min(paidCount + 1, table.splitCount);

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true);

    // Calculado a partir do estado ANTES do pagamento (não depois), pois
    // recordPayment só resolve quando o servidor confirma a escrita — nesse
    // meio-tempo o listener local ainda não necessariamente atualizou
    // `tables`, então ler o estado "pós-pagamento" seria pouco confiável.
    const willBeFullyPaid = remaining - nextAmount <= PAID_EPSILON;

    try {
      await recordPayment(tableId, selected);
    } catch (err) {
      setConfirming(false);
      showAlert('Erro ao registrar pagamento', 'Verifique sua conexão e tente novamente.');
      return;
    }

    if (willBeFullyPaid) {
      const result = await closeTable(tableId);
      if (result === 'ok') {
        navigation.popToTop();
        return;
      }
      showAlert('Não foi possível fechar a mesa', 'Tente novamente em instantes.');
      setConfirming(false);
      return;
    }

    setSelected(null);
    setConfirming(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Fechar Mesa {table.label}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Taxa de serviço {table.serviceFeeEnabled ? '(10%)' : '(desativada)'}
            </Text>
            <Text style={styles.summaryValue}>{formatCurrency(serviceFeeAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Geral</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {isSplit && (
          <View style={styles.splitProgressCard}>
            <View style={styles.splitProgressHeader}>
              <Text style={styles.splitProgressTitle}>
                Pago: {paidCount} de {table.splitCount} pessoas
              </Text>
              <Text style={styles.splitProgressRemaining}>
                Restam {formatCurrency(remaining)}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (paidTotal / total) * 100)}%` },
                ]}
              />
            </View>

            <View style={styles.chipsRow}>
              {Array.from({ length: table.splitCount }).map((_, index) => {
                const payment = table.payments[index];
                const meta = payment ? METHOD_META[payment.method] : null;
                return (
                  <View
                    key={index}
                    style={[
                      styles.personChip,
                      payment && { backgroundColor: `${meta!.color}22`, borderColor: meta!.color },
                    ]}
                  >
                    {payment ? (
                      <Ionicons name={meta!.icon} size={14} color={meta!.color} />
                    ) : (
                      <Text style={styles.personChipText}>{index + 1}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {isSplit ? `Forma de pagamento · Pessoa ${currentPersonNumber}` : 'Forma de pagamento'}
        </Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_OPTIONS.map((opt) => (
            <PaymentMethodButton
              key={opt.method}
              label={opt.label}
              icon={opt.icon}
              color={opt.color}
              selected={selected === opt.method}
              onPress={() => setSelected(opt.method)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
          disabled={!selected || confirming}
          onPress={handleConfirm}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />
          <Text style={styles.confirmText}>
            {isSplit
              ? `Confirmar Pessoa ${currentPersonNumber} · ${formatCurrency(nextAmount)}`
              : `Confirmar Pagamento · ${formatCurrency(nextAmount)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  totalValue: {
    ...typography.h1,
    color: colors.emerald,
    textShadowColor: colors.emeraldGlow,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  splitProgressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  splitProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitProgressTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  splitProgressRemaining: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHighlight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  personChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personChipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emerald,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    ...typography.h3,
    color: colors.textInverse,
  },
});
