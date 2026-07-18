import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { CATEGORY_LABELS, MENU_ITEMS } from '../data/menu';
import { usePosStore } from '../context/usePosStore';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { MenuCategory, MenuItem } from '../types';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItems'>;

const CATEGORIES: MenuCategory[] = ['bebidas', 'porcoes', 'pratos', 'sobremesas'];

export function AddItemsScreen({ navigation, route }: Props) {
  const { tableId } = route.params;
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('bebidas');

  const table = usePosStore((s) => s.tables.find((t) => t.id === tableId));
  const addItem = usePosStore((s) => s.addItem);
  const incrementItem = usePosStore((s) => s.incrementItem);
  const decrementItem = usePosStore((s) => s.decrementItem);
  const removeItem = usePosStore((s) => s.removeItem);

  const filteredItems = useMemo(
    () => MENU_ITEMS.filter((m) => m.category === activeCategory),
    [activeCategory]
  );

  const totalItemsInCart = table?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const getOrderItem = (menuItem: MenuItem) =>
    table?.items.find((i) => i.menuItemId === menuItem.id);

  const renderItem = ({ item }: { item: MenuItem }) => {
    const orderItem = getOrderItem(item);
    return (
      <View style={styles.itemCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
          <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
        </View>

        {orderItem ? (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              accessibilityLabel={`Diminuir quantidade de ${item.name}`}
              onPress={() =>
                orderItem.quantity === 1
                  ? removeItem(tableId, orderItem.id)
                  : decrementItem(tableId, orderItem.id)
              }
            >
              <Ionicons
                name={orderItem.quantity === 1 ? 'trash-outline' : 'remove'}
                size={16}
                color={orderItem.quantity === 1 ? colors.danger : colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.qty}>{orderItem.quantity}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              accessibilityLabel={`Aumentar quantidade de ${item.name}`}
              onPress={() => incrementItem(tableId, orderItem.id)}
            >
              <Ionicons name="add" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            accessibilityLabel={`Adicionar ${item.name}`}
            onPress={() => addItem(tableId, item, 1)}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Adicionar Itens</Text>
          <Text style={styles.subtitle}>Mesa {table?.label}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          label={`Concluir${totalItemsInCart > 0 ? ` (${totalItemsInCart} itens)` : ''}`}
          size="lg"
          variant="emerald"
          onPress={() => navigation.goBack()}
        />
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
  subtitle: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  itemDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemPrice: {
    ...typography.body,
    color: colors.emerald,
    marginTop: 4,
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    ...typography.h3,
    color: colors.textPrimary,
    minWidth: 22,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
