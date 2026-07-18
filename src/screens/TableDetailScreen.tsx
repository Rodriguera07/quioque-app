import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { OrderItemRow } from '../components/OrderItemRow';
import { SERVICE_FEE_RATE, usePosStore } from '../context/usePosStore';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { formatCurrency, formatTime } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'TableDetail'>;

export function TableDetailScreen({ navigation, route }: Props) {
  const { tableId } = route.params;
  const table = usePosStore((s) => s.tables.find((t) => t.id === tableId));
  const incrementItem = usePosStore((s) => s.incrementItem);
  const decrementItem = usePosStore((s) => s.decrementItem);
  const removeItem = usePosStore((s) => s.removeItem);
  const toggleServiceFee = usePosStore((s) => s.toggleServiceFee);

  if (!table) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState icon="alert-circle-outline" title="Mesa não encontrada" />
      </SafeAreaView>
    );
  }

  const isOpen = table.status === 'open';
  const subtotal = table.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const serviceFeeAmount = table.serviceFeeEnabled ? subtotal * SERVICE_FEE_RATE : 0;
  const total = subtotal + serviceFeeAmount;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{table.label}</Text>
          <Text style={styles.subtitle}>
            Aberta às {formatTime(table.openedAt)}
            {table.waiterName ? ` · ${table.waiterName}` : ''}
          </Text>
        </View>
        {!isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>Fechada</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Itens consumidos</Text>
          {isOpen && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('AddItems', { tableId })}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addBtnText}>Adicionar Itens</Text>
            </TouchableOpacity>
          )}
        </View>

        {table.items.length === 0 ? (
          <EmptyState
            icon="fast-food-outline"
            title="Nenhum item lançado"
            subtitle="Adicione itens do cardápio para iniciar a consumação."
          />
        ) : (
          <View style={styles.itemsCard}>
            {table.items.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                editable={isOpen}
                onIncrement={() => incrementItem(tableId, item.id)}
                onDecrement={() => decrementItem(tableId, item.id)}
                onRemove={() => removeItem(tableId, item.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.feeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.feeTitle}>Taxa de serviço (10%)</Text>
            <Text style={styles.feeSub}>Aplicada sobre o subtotal da mesa</Text>
          </View>
          <Switch
            accessibilityLabel="Taxa de serviço 10%"
            value={table.serviceFeeEnabled}
            onValueChange={() => toggleServiceFee(tableId)}
            disabled={!isOpen}
            trackColor={{ false: colors.surfaceHighlight, true: colors.emeraldMuted }}
            thumbColor={table.serviceFeeEnabled ? colors.emerald : colors.textMuted}
          />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de serviço</Text>
            <Text style={styles.summaryValue}>{formatCurrency(serviceFeeAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {isOpen && (
        <View style={styles.footer}>
          <Button
            label="Fechar Mesa"
            size="lg"
            variant="emerald"
            disabled={table.items.length === 0}
            onPress={() => navigation.navigate('CloseTable', { tableId })}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  addBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  feeTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  feeSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
