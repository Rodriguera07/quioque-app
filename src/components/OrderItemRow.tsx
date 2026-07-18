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
            style={styles.stepBtn}
            onPress={item.quantity === 1 ? onRemove : onDecrement}
          >
            <Ionicons
              name={item.quantity === 1 ? 'trash-outline' : 'remove'}
              size={15}
              color={item.quantity === 1 ? colors.danger : colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={onIncrement}>
            <Ionicons name="add" size={15} color={colors.textPrimary} />
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
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    ...typography.h3,
    color: colors.textPrimary,
    minWidth: 20,
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
