import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { CATEGORY_ICONS } from '../data/menu';
import { colors, shape, spacing, typography } from '../theme';
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
          <AnimatedPressable
            style={[styles.stepBtn, item.quantity === 1 && styles.stepBtnDanger]}
            stateLayerColor={item.quantity === 1 ? colors.danger : colors.onSurface}
            onPress={item.quantity === 1 ? onRemove : onDecrement}
            accessibilityLabel={item.quantity === 1 ? 'Remover item' : 'Diminuir quantidade'}
          >
            <Ionicons
              name={item.quantity === 1 ? 'trash-outline' : 'remove'}
              size={14}
              color={item.quantity === 1 ? colors.danger : colors.textPrimary}
            />
          </AnimatedPressable>
          <Text style={styles.qty}>{item.quantity}</Text>
          <AnimatedPressable
            style={[styles.stepBtn, styles.stepBtnAdd]}
            stateLayerColor={colors.emerald}
            onPress={onIncrement}
            accessibilityLabel="Aumentar quantidade"
          >
            <Ionicons name="add" size={14} color={colors.emerald} />
          </AnimatedPressable>
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
    borderBottomColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: shape.medium,
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
    borderRadius: shape.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
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
