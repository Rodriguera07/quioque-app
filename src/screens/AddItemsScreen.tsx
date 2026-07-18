import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { CATEGORY_ICONS, CATEGORY_LABELS, MENU_ITEMS } from '../data/menu';
import { usePosStore } from '../context/usePosStore';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import { MenuCategory, MenuItem } from '../types';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItems'>;
type CategoryFilter = MenuCategory | 'all';

const CATEGORIES: CategoryFilter[] = ['all', 'bebidas', 'drinks', 'doses', 'porcoes', 'pasteis'];

const ACCENT_MAP: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a',
  é: 'e', ê: 'e',
  í: 'i',
  ó: 'o', ô: 'o', õ: 'o',
  ú: 'u', ü: 'u',
  ç: 'c',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => ACCENT_MAP[char] ?? char)
    .join('');
}

export function AddItemsScreen({ navigation, route }: Props) {
  const { tableId } = route.params;
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');

  const table = usePosStore((s) => s.tables.find((t) => t.id === tableId));
  const addItem = usePosStore((s) => s.addItem);
  const incrementItem = usePosStore((s) => s.incrementItem);
  const decrementItem = usePosStore((s) => s.decrementItem);
  const removeItem = usePosStore((s) => s.removeItem);

  const filteredItems = useMemo(() => {
    const query = normalize(search.trim());
    return MENU_ITEMS.filter((m) => {
      const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
      const matchesSearch = query.length === 0 || normalize(m.name).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const totalItemsInCart = table?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const getOrderItem = (menuItem: MenuItem) =>
    table?.items.find((i) => i.menuItemId === menuItem.id);

  const renderItem = ({ item }: { item: MenuItem }) => {
    const orderItem = getOrderItem(item);
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemIconWrap}>
          <Ionicons name={CATEGORY_ICONS[item.category]} size={18} color={colors.primary} />
        </View>
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
          <AnimatedPressable
            style={styles.addBtn}
            accessibilityLabel={`Adicionar ${item.name}`}
            onPress={() => addItem(tableId, item, 1)}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
          </AnimatedPressable>
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

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar item do cardápio..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Limpar busca">
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => {
          const label = cat === 'all' ? 'Todas' : CATEGORY_LABELS[cat];
          const active = activeCategory === cat;
          return (
            <AnimatedPressable
              key={cat}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              {cat !== 'all' && (
                <Ionicons
                  name={CATEGORY_ICONS[cat]}
                  size={14}
                  color={active ? colors.primary : colors.textSecondary}
                />
              )}
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                {label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Nenhum item encontrado"
          subtitle="Tente buscar por outro nome ou trocar a categoria."
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.sm,
    height: 44,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%',
  },
  categoryRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: colors.emerald,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
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
