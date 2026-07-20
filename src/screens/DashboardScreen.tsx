import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { EmptyState } from '../components/EmptyState';
import { PulseDot } from '../components/PulseDot';
import { ReceiptTornEdge } from '../components/ReceiptTornEdge';
import { TableCard } from '../components/TableCard';
import { useAuthStore } from '../context/useAuthStore';
import {
  getClosedTablesToday,
  getOpenTables,
  getTodayRevenue,
  getTopSellingItems,
  usePosStore,
} from '../context/usePosStore';
import { colors, monoFontFamily, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { confirmAlert, showAlert } from '../utils/alert';
import { formatCurrency } from '../utils/format';
import { useTick } from '../hooks/useTick';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  useTick(30000); // mantém o tempo decorrido das mesas atualizado

  const userName = useAuthStore((s) => s.userName);
  const logout = useAuthStore((s) => s.logout);

  const tables = usePosStore((s) => s.tables);
  const closedSalesToday = usePosStore((s) => s.closedSalesToday);
  const endDay = usePosStore((s) => s.endDay);

  const openTables = getOpenTables(tables);
  const closedTables = getClosedTablesToday(tables);
  const revenue = getTodayRevenue(closedSalesToday);
  const topItems = getTopSellingItems(tables, closedSalesToday, 5);
  const topMax = topItems[0]?.quantity ?? 1;
  const avgTicket = closedTables.length > 0 ? revenue / closedTables.length : 0;

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

      <View style={styles.receipt}>
        <View style={styles.receiptTopRow}>
          <Text style={styles.receiptLabel}>FATURAMENTO DE HOJE</Text>
          <View style={styles.statusPill}>
            <PulseDot size={6} />
            <Text style={styles.statusText}>caixa aberto</Text>
          </View>
        </View>
        <Text style={styles.receiptValue}>{formatCurrency(revenue)}</Text>
        <View style={styles.receiptStatsRow}>
          <View style={styles.receiptStat}>
            <Text style={styles.receiptStatValue}>{openTables.length}</Text>
            <Text style={styles.receiptStatLabel}>em atendimento</Text>
          </View>
          <View style={styles.receiptStatDivider} />
          <View style={styles.receiptStat}>
            <Text style={styles.receiptStatValue}>{closedTables.length}</Text>
            <Text style={styles.receiptStatLabel}>fechadas hoje</Text>
          </View>
          <View style={styles.receiptStatDivider} />
          <View style={styles.receiptStat}>
            <Text style={styles.receiptStatValue}>
              {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.receiptStatLabel}>ticket médio</Text>
          </View>
        </View>
      </View>
      <ReceiptTornEdge />

      <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
        <Text style={styles.sectionTitle}>Mais vendidos do dia</Text>
      </View>

      {topItems.length === 0 ? (
        <View style={styles.topItemsEmpty}>
          <Text style={styles.emptyInlineText}>Nenhum item vendido ainda hoje.</Text>
        </View>
      ) : (
        <View style={styles.topItemsCard}>
          {topItems.map((item, index) => {
            const pct = Math.max(4, Math.round((item.quantity / topMax) * 100));
            return (
              <View key={item.menuItemId} style={styles.topItemRow}>
                <Text style={styles.topItemRank}>{index + 1}</Text>
                <View style={styles.topItemBody}>
                  <Text style={styles.topItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.topItemBarTrack}>
                    <View style={[styles.topItemBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
                <Text style={styles.topItemQty}>{item.quantity}×</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.tablesCard}>
        <View style={styles.tablesCardHeader}>
          <Text style={styles.sectionTitle}>Mesas abertas</Text>
          <Text style={styles.tablesCardCount}>{openTables.length}</Text>
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
      </View>

      <AnimatedPressable style={styles.endDayBar} onPress={handleEndDay}>
        <View style={styles.endDayIconWrap}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.endDayTitle}>Encerrar o dia</Text>
          <Text style={styles.endDaySub}>Fecha o caixa e zera o painel para amanhã</Text>
        </View>
        <View style={styles.endDayChevronWrap}>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </AnimatedPressable>

      </ScrollView>

      <AnimatedPressable style={styles.fabWrap} onPress={() => navigation.navigate('OpenTable')}>
        <Ionicons name="add" size={22} color={colors.textInverse} />
        <Text style={styles.fabLabel}>Abrir Nova Mesa</Text>
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
  receipt: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomWidth: 0,
    borderRadius: radius.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: spacing.lg,
  },
  receiptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    ...typography.caption,
    color: colors.emerald,
  },
  receiptValue: {
    ...typography.display,
    fontFamily: monoFontFamily,
    fontSize: 36,
    color: colors.emerald,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  receiptStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  receiptStat: {
    flex: 1,
  },
  receiptStatValue: {
    ...typography.h3,
    fontFamily: monoFontFamily,
    color: colors.textPrimary,
  },
  receiptStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  receiptStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  endDayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 114, 0.35)',
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  endDayIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endDayTitle: {
    ...typography.h3,
    color: colors.danger,
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
  sectionTitle: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textMuted,
  },
  tablesCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tablesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  tablesCardCount: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    color: colors.textMuted,
  },
  topItemsCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
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
    gap: spacing.sm,
  },
  topItemRank: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    color: colors.sand,
    width: 14,
  },
  topItemBody: {
    flex: 1,
  },
  topItemName: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  topItemBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryMuted,
    overflow: 'hidden',
  },
  topItemBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.sand,
  },
  topItemQty: {
    ...typography.bodySm,
    fontFamily: monoFontFamily,
    color: colors.textSecondary,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fabWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.sand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    shadowColor: colors.sand,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabLabel: {
    ...typography.h3,
    color: colors.textInverse,
  },
});
