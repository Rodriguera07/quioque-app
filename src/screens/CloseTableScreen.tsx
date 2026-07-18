import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentMethodButton } from '../components/PaymentMethodButton';
import { SERVICE_FEE_RATE, usePosStore } from '../context/usePosStore';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { PaymentMethod } from '../types';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'CloseTable'>;

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { method: 'pix', label: 'PIX', icon: 'qr-code-outline', color: colors.pix },
  { method: 'dinheiro', label: 'Dinheiro', icon: 'cash-outline', color: colors.cash },
  { method: 'debito', label: 'Débito', icon: 'card-outline', color: colors.debit },
  { method: 'credito', label: 'Crédito', icon: 'card', color: colors.credit },
];

export function CloseTableScreen({ navigation, route }: Props) {
  const { tableId } = route.params;
  const table = usePosStore((s) => s.tables.find((t) => t.id === tableId));
  const closeTable = usePosStore((s) => s.closeTable);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!table) return null;

  const subtotal = table.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const serviceFeeAmount = table.serviceFeeEnabled ? subtotal * SERVICE_FEE_RATE : 0;
  const total = subtotal + serviceFeeAmount;

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    closeTable(tableId, selected);
    navigation.popToTop();
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

        <Text style={styles.sectionTitle}>Forma de pagamento</Text>
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
          <Text style={styles.confirmText}>Confirmar Pagamento · {formatCurrency(total)}</Text>
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
