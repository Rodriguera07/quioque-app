import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderItemRow } from '../components/OrderItemRow';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { formatCurrency, formatDateLabel, formatTime } from '../utils/format';
import { PAYMENT_LABELS } from '../utils/payments';

type Props = NativeStackScreenProps<RootStackParamList, 'ClosedTableDetail'>;

export function ClosedTableDetailScreen({ navigation, route }: Props) {
  const { sale } = route.params;
  const { contentStyle } = useResponsiveContent();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mesa {sale.tableLabel}</Text>
          <Text style={styles.subtitle}>{formatDateLabel(sale.closedAt)}</Text>
        </View>
        <View style={styles.closedBadge}>
          <Text style={styles.closedBadgeText}>Fechada</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="log-in-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Aberta às {formatTime(sale.openedAt)}
              {sale.openedByUserName ? ` por ${sale.openedByUserName}` : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Fechada às {formatTime(sale.closedAt)} por {sale.closedByUserName}
            </Text>
          </View>
          {sale.waiterName ? (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>Garçom: {sale.waiterName}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Itens consumidos</Text>
        <View style={styles.itemsCard}>
          {sale.items.map((item) => (
            <OrderItemRow key={item.id} item={item} editable={false} />
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(sale.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de serviço</Text>
            <Text style={styles.summaryValue}>{formatCurrency(sale.serviceFeeAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(sale.total)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {sale.payments.length > 1 ? `Pagamentos · ${sale.payments.length} pessoas` : 'Pagamento'}
        </Text>
        <View style={styles.paymentCard}>
          {sale.payments.map((payment, index) => {
            const meta = PAYMENT_LABELS[payment.method];
            return (
              <View
                key={payment.id}
                style={[
                  styles.paymentRow,
                  index === sale.payments.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Ionicons name={meta.icon} size={18} color={meta.color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentLabel}>{meta.label}</Text>
                  <Text style={styles.paymentTime}>{formatTime(payment.paidAt)}</Text>
                </View>
                <Text style={styles.paymentValue}>{formatCurrency(payment.amount)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
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
  subtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 1,
  },
  closedBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  closedBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
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
    ...typography.h2,
    color: colors.emerald,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paymentLabel: {
    ...typography.bodySm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  paymentTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  paymentValue: {
    ...typography.body,
    color: colors.emerald,
    fontWeight: '700',
  },
});
