import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CATEGORY_ICONS } from '../data/menu';
import { colors, radius, spacing, typography } from '../theme';
import { OrderItem } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  item: OrderItem;
  editable?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
}

export function OrderItemRow({ item, editable = true, onIncrement, onDecrement, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={CATEGORY_ICONS[item.category]} size={16} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.unitPrice}>{formatCurrency(item.unitPrice)} / un</Text>
      </View>

      {editable ? (
        <View style={styles.stepper}>
          <TouchableOpacity
            style={[styles.stepBtn, item.quantity === 1 && styles.stepBtnDanger]}
            onPress={item.quantity === 1 ? onRemove : onDecrement}
            accessibilityLabel={item.quantity === 1 ? 'Remover item' : 'Diminuir quantidade'}
          >
            <Ionicons
              name={item.quantity === 1 ? 'trash-outline' : 'remove'}
              size={14}
              color={item.quantity === 1 ? colors.danger : colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity}</Text>
          <TouchableOpacity
            style={[styles.stepBtn, styles.stepBtnAdd]}
            onPress={onIncrement}
            accessibilityLabel="Aumentar quantidade"
          >
            <Ionicons name="add" size={14} color={colors.emerald} />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.qtyStatic}>{item.quantity}x</Text>
      )}

      <Text style={styles.lineTotal}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
  },
  unitPrice: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHighlight,
  },
  stepBtnDanger: {
    backgroundColor: colors.dangerMuted,
  },
  stepBtnAdd: {
    backgroundColor: colors.emeraldMuted,
  },
  qty: {
    ...typography.h3,
    color: colors.textPrimary,
    minWidth: 22,
    textAlign: 'center',
  },
  qtyStatic: {
    ...typography.body,
    color: colors.textSecondary,
  },
  lineTotal: {
    ...typography.h3,
    color: colors.textPrimary,
    minWidth: 78,
    textAlign: 'right',
  },
});
