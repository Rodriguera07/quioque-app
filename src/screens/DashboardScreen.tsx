import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/StatCard';
import { TableCard } from '../components/TableCard';
import { useAuthStore } from '../context/useAuthStore';
import {
  getClosedTablesToday,
  getOpenTables,
  getTodayRevenue,
  getTopSellingItems,
  usePosStore,
} from '../context/usePosStore';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { confirmAlert, showAlert } from '../utils/alert';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const RANK_STYLES = [
  { bg: colors.sandMuted, text: colors.sand },
  { bg: 'rgba(155, 178, 189, 0.16)', text: colors.textSecondary },
  { bg: colors.coralMuted, text: colors.coral },
];

export function DashboardScreen({ navigation }: Props) {
  const userName = useAuthStore((s) => s.userName);
  const logout = useAuthStore((s) => s.logout);

  const tables = usePosStore((s) => s.tables);
  const closedSalesToday = usePosStore((s) => s.closedSalesToday);
  const endDay = usePosStore((s) => s.endDay);

  const openTables = getOpenTables(tables);
  const closedTables = getClosedTablesToday(tables);
  const revenue = getTodayRevenue(closedSalesToday);
  const topItems = getTopSellingItems(tables, closedSalesToday, 5);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const initial = (userName ?? 'G').charAt(0).toUpperCase();

  const handleEndDay = async () => {
    if (openTables.length > 0) {
      showAlert(
        'Mesas ainda abertas',
        `Existem ${openTables.length} mesa(s) aberta(s). Feche todas as mesas antes de encerrar o dia.`
      );
      return;
    }
    if (closedSalesToday.length === 0) {
      showAlert('Nenhuma venda hoje', 'Não há vendas registradas para encerrar o dia.');
      return;
    }
    const confirmed = await confirmAlert(
      'Encerrar o dia',
      `Confirmar o fechamento do caixa de hoje?\nFaturamento total: ${formatCurrency(revenue)}`,
      'Encerrar dia'
    );
    if (!confirmed) return;

    const summary = endDay();
    if (summary) {
      navigation.navigate('EndDaySummary', { summary });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[colors.emerald, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
          <View>
            <Text style={styles.greeting}>Olá, {userName ?? 'Gerente'}</Text>
            <Text style={styles.date}>{capitalize(dateLabel)}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <AnimatedPressable
            style={styles.iconButton}
            accessibilityLabel="Ver relatórios"
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="bar-chart-outline" size={19} color={colors.textPrimary} />
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} accessibilityLabel="Sair" onPress={logout}>
            <Ionicons name="log-out-outline" size={19} color={colors.textPrimary} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Faturamento hoje"
          value={formatCurrency(revenue)}
          icon="trending-up-outline"
          accent={colors.emerald}
          accentGlow={colors.emeraldGlow}
          highlight
        />
        <StatCard
          label="Mesas abertas"
          value={String(openTables.length)}
          icon="restaurant-outline"
          accent={colors.primary}
          accentGlow={colors.primaryGlow}
        />
        <StatCard
          label="Mesas fechadas"
          value={String(closedTables.length)}
          icon="checkmark-done-outline"
          accent={colors.textSecondary}
          accentGlow={colors.surfaceElevated}
        />
      </View>

      <AnimatedPressable style={styles.endDayBar} onPress={handleEndDay}>
        <LinearGradient
          colors={[colors.coralMuted, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.endDayIconWrap}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.endDayTitle}>Encerrar / conferir dia</Text>
          <Text style={styles.endDaySub}>Fecha o caixa e reinicia o painel</Text>
        </View>
        <View style={styles.endDayChevronWrap}>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </AnimatedPressable>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="flame-outline" size={16} color={colors.coral} />
          <Text style={styles.sectionTitle}>Mais vendidos do dia</Text>
        </View>
      </View>

      {topItems.length === 0 ? (
        <View style={styles.topItemsEmpty}>
          <Text style={styles.emptyInlineText}>Nenhum item vendido ainda hoje.</Text>
        </View>
      ) : (
        <View style={styles.topItemsCard}>
          {topItems.map((item, index) => {
            const rank = RANK_STYLES[index] ?? RANK_STYLES[2];
            return (
              <View
                key={item.menuItemId}
                style={[styles.topItemRow, index === topItems.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
                  <Text style={[styles.rankText, { color: rank.text }]}>{index + 1}</Text>
                </View>
                <Text style={styles.topItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.topItemQty}>{item.quantity}x</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Mesas ativas</Text>
        </View>
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCount}>{openTables.length}</Text>
        </View>
      </View>

      {openTables.length === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title="Nenhuma mesa aberta"
          subtitle="Toque em 'Abrir Nova Mesa' para começar um atendimento."
        />
      ) : (
        <View style={styles.tablesGrid}>
          {openTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onPress={() => navigation.navigate('TableDetail', { tableId: table.id })}
            />
          ))}
        </View>
      )}

      </ScrollView>

      <AnimatedPressable style={styles.fabWrap} onPress={() => navigation.navigate('OpenTable')}>
        <LinearGradient
          colors={[colors.emerald, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={22} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Abrir Nova Mesa</Text>
        </LinearGradient>
      </AnimatedPressable>
    </SafeAreaView>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl + 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.emerald,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatarText: {
    ...typography.h3,
    color: colors.textInverse,
  },
  greeting: {
    ...typography.h1,
    fontSize: 22,
    color: colors.textPrimary,
  },
  date: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  endDayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.coralGlow,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  endDayIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.coralMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endDayTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  endDaySub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  endDayChevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionCountBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  topItemsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  topItemsEmpty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyInlineText: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.caption,
    fontWeight: '700',
  },
  topItemName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  topItemQty: {
    ...typography.h3,
    color: colors.emerald,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  fabWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    borderRadius: radius.full,
    shadowColor: colors.emerald,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  fabLabel: {
    ...typography.h3,
    color: colors.textInverse,
  },
});
