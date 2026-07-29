import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { ConfirmModal } from '../components/ConfirmModal';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../data/menu';
import { usePosStore } from '../context/usePosStore';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { RootStackParamList } from '../navigation/types';
import { colors, nunitoFontFamily, radius, spacing, typography } from '../theme';
import { MenuCategory, MenuItem } from '../types';
import { confirmAlert, showAlert } from '../utils/alert';
import { generateId } from '../utils/id';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuManagement'>;
type CategoryFilter = MenuCategory | 'all';

const CATEGORIES: MenuCategory[] = ['bebidas', 'drinks', 'doses', 'porcoes', 'pasteis'];
const FILTERS: CategoryFilter[] = ['all', ...CATEGORIES];

function stripImage(item: MenuItem) {
  const { image, ...rest } = item;
  return rest;
}

export function MenuManagementScreen({ navigation }: Props) {
  const menuItems = usePosStore((s) => s.menuItems);
  const saveMenuItems = usePosStore((s) => s.saveMenuItems);
  const { contentStyle } = useResponsiveContent();

  const [draft, setDraft] = useState<MenuItem[]>(menuItems);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    const a = draft.map(stripImage);
    const b = menuItems.map(stripImage);
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [draft, menuItems]);

  const visibleCategories = activeFilter === 'all' ? CATEGORIES : [activeFilter];

  const updateItem = (id: string, patch: Partial<MenuItem>) => {
    setDraft((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const handleAddItem = (category: MenuCategory) => {
    const id = generateId('menu');
    setDraft((prev) => [...prev, { id, category, name: '', price: 0 }]);
  };

  const handleConfirmRemove = () => {
    if (!removeTarget) return;
    setDraft((prev) => prev.filter((i) => i.id !== removeTarget));
    setRemoveTarget(null);
  };

  const handleBack = () => {
    navigation.goBack();
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleGoBackPress = async () => {
    if (!isDirty) {
      handleBack();
      return;
    }
    const discard = await confirmAlert(
      'Descartar alterações?',
      'Você tem mudanças no cardápio que ainda não foram salvas.',
      'Descartar'
    );
    if (discard) handleBack();
  };

  const handleSave = async () => {
    const invalid = draft.find((i) => !i.name.trim() || i.price <= 0);
    if (invalid) {
      showAlert(
        'Revise o cardápio',
        'Todo item precisa de um nome e um valor maior que zero antes de salvar.'
      );
      return;
    }
    setSaving(true);
    const ok = await saveMenuItems(draft.map(stripImage));
    setSaving(false);
    if (ok) {
      showAlert('Cardápio salvo', 'As alterações já estão disponíveis para toda a equipe.');
    } else {
      showAlert('Erro', 'Não foi possível salvar o cardápio. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBackPress} style={styles.backBtn} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cardápio</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            const label = f === 'all' ? 'Todas' : CATEGORY_LABELS[f];
            return (
              <AnimatedPressable
                key={f}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                {f !== 'all' && (
                  <Ionicons
                    name={CATEGORY_ICONS[f]}
                    size={14}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                )}
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
                  {label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {visibleCategories.map((cat) => {
            const items = draft.filter((i) => i.category === cat);
            return (
              <View key={cat} style={styles.section}>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name={CATEGORY_ICONS[cat]} size={15} color={colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>{CATEGORY_LABELS[cat]}</Text>
                  <Text style={styles.sectionCount}>{items.length}</Text>
                </View>

                <View style={styles.card}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <TextInput
                        value={item.name}
                        onChangeText={(v) => updateItem(item.id, { name: v })}
                        placeholder="Nome do item"
                        placeholderTextColor={colors.textMuted}
                        style={styles.nameInput}
                      />
                      <View style={styles.priceWrap}>
                        <Text style={styles.priceCurrency}>R$</Text>
                        <TextInput
                          value={item.price ? String(item.price) : ''}
                          onChangeText={(v) =>
                            updateItem(item.id, { price: Number(v.replace(',', '.')) || 0 })
                          }
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                          style={styles.priceInput}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => setRemoveTarget(item.id)}
                        style={styles.removeBtn}
                        accessibilityLabel={`Remover ${item.name || 'item'}`}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {items.length === 0 && (
                    <Text style={styles.emptySection}>Nenhum item nesta categoria ainda.</Text>
                  )}

                  <AnimatedPressable style={styles.addRow} onPress={() => handleAddItem(cat)}>
                    <Ionicons name="add-circle-outline" size={17} color={colors.primary} />
                    <Text style={styles.addRowText}>Adicionar item</Text>
                  </AnimatedPressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, contentStyle]}>
          <Button
            label={saving ? 'Salvando…' : 'Salvar Cardápio'}
            variant="emerald"
            size="lg"
            loading={saving}
            disabled={!isDirty}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={removeTarget !== null}
        icon="trash-outline"
        iconColor={colors.danger}
        title="Remover item do cardápio?"
        message="Isso não afeta pedidos já lançados em mesas — só deixa de aparecer para novos pedidos."
        confirmLabel="Remover"
        destructive
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    flexShrink: 0,
    minHeight: 36,
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
  filterChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterChipText: {
    ...typography.bodySm,
    fontFamily: nunitoFontFamily.semiBold,
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  sectionCount: {
    ...typography.caption,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  nameInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
    height: 42,
    width: 84,
    gap: 2,
  },
  priceCurrency: {
    ...typography.caption,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textMuted,
  },
  priceInput: {
    flex: 1,
    ...typography.body,
    fontFamily: nunitoFontFamily.bold,
    color: colors.emerald,
    height: '100%',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerMuted,
  },
  emptySection: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    marginTop: spacing.xxs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  addRowText: {
    ...typography.bodySm,
    fontFamily: nunitoFontFamily.bold,
    color: colors.primary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
