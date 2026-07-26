import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { ConfirmModal } from '../components/ConfirmModal';
import { PulseDot } from '../components/PulseDot';
import { TableCard } from '../components/TableCard';
import { WaveDivider } from '../components/WaveDivider';
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
import { getDaySummary } from '../services/firestoreOrg';
import { formatDateKey, formatTime } from '../utils/format';
import { useTick } from '../hooks/useTick';
import { useResponsiveContent, widthForColumns } from '../hooks/useResponsiveContent';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type EndDayDialog = 'blocked-open' | 'blocked-empty' | 'confirm' | null;

const TOP_ITEMS_COUNT = 3;
const RANK_STYLE = [
  { bg: colors.coralMuted, fg: colors.coral },
  { bg: colors.primaryMuted, fg: colors.primary },
  { bg: colors.sandMuted, fg: colors.sand },
];

function splitCurrencyParts(value: number): { main: string; cents: string } {
  const fixed = Math.max(0, value).toFixed(2);
  const [intPart, centsPart] = fixed.split('.');
  return { main: `R$ ${Number(intPart).toLocaleString('pt-BR')}`, cents: centsPart };
}

export function DashboardScreen({ navigation }: Props) {
  useTick(30000); // mantém o tempo decorrido das mesas atualizado

  const { contentStyle, tableColumns } = useResponsiveContent();
  const tableCardWidth = widthForColumns(tableColumns);
  const [endDayDialog, setEndDayDialog] = useState<EndDayDialog>(null);
  const [endingDay, setEndingDay] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  // Marca a partir de quando uma mesa aberta conta como "novidade" — só
  // avança quando o painel de notificações é fechado, para a lista não
  // sumir enquanto o usuário ainda está com o painel aberto na tela.
  const [notifSeenAt, setNotifSeenAt] = useState(() => new Date().toISOString());
  const [yesterdayRevenue, setYesterdayRevenue] = useState<number | null>(null);

  const userName = useAuthStore((s) => s.user?.displayName ?? null);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const logout = useAuthStore((s) => s.logout);

  const orgId = usePosStore((s) => s.orgId);
  const tables = usePosStore((s) => s.tables);
  const closedSalesToday = usePosStore((s) => s.closedSalesToday);
  const endDay = usePosStore((s) => s.endDay);

  const openTables = getOpenTables(tables);
  const closedTables = getClosedTablesToday(tables);
  const revenue = getTodayRevenue(closedSalesToday);
  const topItems = getTopSellingItems(tables, closedSalesToday, TOP_ITEMS_COUNT);
  const topMax = topItems[0]?.quantity ?? 1;

  useEffect(() => {
    if (!orgId) {
      setYesterdayRevenue(null);
      return;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    getDaySummary(orgId, formatDateKey(yesterday))
      .then((summary) => setYesterdayRevenue(summary?.totalRevenue ?? null))
      .catch(() => setYesterdayRevenue(null));
  }, [orgId]);

  const trendPct =
    yesterdayRevenue && yesterdayRevenue > 0 ? ((revenue - yesterdayRevenue) / yesterdayRevenue) * 100 : null;

  const newTableNotifications = useMemo(
    () =>
      openTables
        .filter((t) => t.openedAt > notifSeenAt)
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
    [openTables, notifSeenAt]
  );
  const avgTicket = closedTables.length > 0 ? revenue / closedTables.length : 0;
  const { main: revenueMain, cents: revenueCents } = splitCurrencyParts(revenue);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const handleEndDay = () => {
    if (!isAdmin) return;
    if (openTables.length > 0) {
      setEndDayDialog('blocked-open');
      return;
    }
    if (closedSalesToday.length === 0) {
      setEndDayDialog('blocked-empty');
      return;
    }
    setEndDayDialog('confirm');
  };

  const handleCloseNotif = () => {
    setNotifOpen(false);
    setNotifSeenAt(new Date().toISOString());
  };

  const handleConfirmEndDay = async () => {
    setEndingDay(true);
    const summary = await endDay();
    setEndingDay(false);
    setEndDayDialog(null);
    if (summary) {
      navigation.navigate('EndDaySummary', { summary });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AnimatedPressable
            style={styles.menuButton}
            accessibilityLabel="Abrir menu"
            accessibilityRole="button"
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu" size={22} color={colors.textInverse} />
          </AnimatedPressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting} numberOfLines={1}>
              Olá, {userName ?? 'Gerente'}
            </Text>
            <Text style={styles.date} numberOfLines={1}>
              {capitalize(dateLabel)}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <AnimatedPressable
            style={styles.iconButton}
            accessibilityLabel="Notificações"
            onPress={() => setNotifOpen(true)}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.textPrimary} />
            {newTableNotifications.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {newTableNotifications.length > 9 ? '9+' : newTableNotifications.length}
                </Text>
              </View>
            )}
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} accessibilityLabel="Sair" onPress={logout}>
            <Ionicons name="log-out-outline" size={19} color={colors.textPrimary} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[colors.emerald, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroGlow} pointerEvents="none" />

        <View style={styles.heroInner}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>CAIXA DO DIA</Text>
            <View style={styles.statusPill}>
              <PulseDot color={colors.white} size={6} />
              <Text style={styles.statusPillText}>Aberto</Text>
            </View>
          </View>

          <Text style={styles.heroSubLabel}>Faturamento de hoje</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmountMain}>{revenueMain}</Text>
            <Text style={styles.heroAmountCents}>,{revenueCents}</Text>
          </View>
          {trendPct !== null && (
            <View style={styles.trendRow}>
              <Ionicons
                name={trendPct >= 0 ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={colors.white}
              />
              <Text style={styles.trendText}>
                {Math.abs(trendPct).toFixed(0)}% em relação a ontem
              </Text>
            </View>
          )}

          <View style={styles.waveWrap}>
            <WaveDivider />
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{openTables.length}</Text>
              <Text style={styles.heroStatLabel}>em atendimento</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{closedTables.length}</Text>
              <Text style={styles.heroStatLabel}>fechadas hoje</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.heroStatLabel}>ticket médio</Text>
            </View>
          </View>
        </View>

        <AnimatedPressable style={styles.heroFooter} onPress={() => navigation.navigate('Reports')}>
          <Text style={styles.heroFooterText}>Ver faturamento completo em Relatórios</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.white} />
        </AnimatedPressable>
      </View>

      <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
        <Text style={styles.sectionTitleBold}>Mais vendidos hoje</Text>
        <Text style={styles.sectionCount}>Top {TOP_ITEMS_COUNT}</Text>
      </View>

      {topItems.length === 0 ? (
        <View style={styles.topItemsEmpty}>
          <Text style={styles.emptyInlineText}>Nenhum item vendido ainda hoje.</Text>
        </View>
      ) : (
        <View style={styles.topItemsCard}>
          {topItems.map((item, index) => {
            const pct = Math.max(4, Math.round((item.quantity / topMax) * 100));
            const rank = RANK_STYLE[index] ?? RANK_STYLE[RANK_STYLE.length - 1];
            return (
              <View key={item.menuItemId} style={styles.topItemRow}>
                <View style={[styles.rankCircle, { backgroundColor: rank.bg }]}>
                  <Text style={[styles.rankNumber, { color: rank.fg }]}>{index + 1}</Text>
                </View>
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

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitleBold}>Mesas abertas</Text>
        <View style={styles.sectionHeaderRight}>
          <Text style={styles.sectionCount}>
            {openTables.length} {openTables.length === 1 ? 'ativa' : 'ativas'}
          </Text>
          <AnimatedPressable
            style={styles.addTableBtn}
            accessibilityLabel="Abrir nova mesa"
            onPress={() => navigation.navigate('OpenTable')}
          >
            <Ionicons name="add" size={18} color={colors.textInverse} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.tablesCard}>
        {openTables.length === 0 ? (
          <View style={styles.tablesEmptyRow}>
            <View style={styles.tablesEmptyIconWrap}>
              <Ionicons name="umbrella-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.tablesEmptyText}>Nenhuma mesa aberta no momento.</Text>
          </View>
        ) : (
          <View style={styles.tablesGrid}>
            {openTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                style={{ width: tableCardWidth }}
                onPress={() => navigation.navigate('TableDetail', { tableId: table.id })}
              />
            ))}
          </View>
        )}
      </View>

      {isAdmin && (
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
      )}

      </ScrollView>

      <ConfirmModal
        visible={endDayDialog === 'blocked-open'}
        icon="alert-circle-outline"
        iconColor={colors.danger}
        title="Mesas ainda abertas"
        message={`Existem ${openTables.length} mesa${openTables.length === 1 ? '' : 's'} aberta${
          openTables.length === 1 ? '' : 's'
        }. Feche todas as mesas antes de encerrar o dia.`}
        confirmLabel="Entendi"
        onCancel={() => setEndDayDialog(null)}
      />

      <ConfirmModal
        visible={endDayDialog === 'blocked-empty'}
        icon="receipt-outline"
        iconColor={colors.textMuted}
        title="Nenhuma venda hoje"
        message="Não há vendas registradas para encerrar o dia."
        confirmLabel="Entendi"
        onCancel={() => setEndDayDialog(null)}
      />

      <ConfirmModal
        visible={endDayDialog === 'confirm'}
        icon="lock-closed-outline"
        iconColor={colors.sand}
        title="Encerrar o dia"
        confirmLabel="Encerrar dia"
        destructive
        loading={endingDay}
        onConfirm={handleConfirmEndDay}
        onCancel={() => setEndDayDialog(null)}
      >
        <View style={styles.endDayRevenueBox}>
          <Text style={styles.endDayRevenueLabel}>FATURAMENTO DE HOJE</Text>
          <Text style={styles.endDayRevenueValue}>
            {revenueMain},{revenueCents}
          </Text>
        </View>
        <Text style={styles.endDayConfirmSub}>
          O caixa será fechado e o painel será zerado para amanhã.
        </Text>
      </ConfirmModal>

      <Modal visible={notifOpen} transparent animationType="fade" onRequestClose={handleCloseNotif}>
        <Pressable style={styles.notifBackdrop} onPress={handleCloseNotif}>
          <Pressable style={styles.notifPanel} onPress={(e) => e.stopPropagation()}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notificações</Text>
              {newTableNotifications.length > 0 && (
                <View style={styles.notifHeaderBadge}>
                  <Text style={styles.notifHeaderBadgeText}>{newTableNotifications.length}</Text>
                </View>
              )}
            </View>

            {newTableNotifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.textMuted} />
                <Text style={styles.notifEmptyText}>Nenhuma novidade por aqui.</Text>
              </View>
            ) : (
              newTableNotifications.map((table) => (
                <AnimatedPressable
                  key={table.id}
                  style={styles.notifRow}
                  onPress={() => {
                    handleCloseNotif();
                    navigation.navigate('TableDetail', { tableId: table.id });
                  }}
                >
                  <View style={styles.notifRowIcon}>
                    <Ionicons name="restaurant-outline" size={16} color={colors.emerald} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifRowTitle}>Mesa {table.label} aberta</Text>
                    <Text style={styles.notifRowSub}>
                      {formatTime(table.openedAt)}
                      {table.waiterName ? ` · ${table.waiterName}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </AnimatedPressable>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: spacing.xxxl,
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
  headerTextWrap: {
    flexShrink: 1,
  },
  greeting: {
    ...typography.h1,
    fontSize: 21,
    color: colors.textPrimary,
  },
  date: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
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
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: spacing.xxs,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
    color: colors.textInverse,
  },
  notifBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'flex-end',
    paddingTop: 64,
    paddingHorizontal: spacing.md,
  },
  notifPanel: {
    width: 300,
    maxWidth: '100%',
    maxHeight: 360,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  notifTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  notifHeaderBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: spacing.xxs,
    backgroundColor: colors.emeraldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeaderBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.emerald,
  },
  notifEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  notifEmptyText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  notifRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.emeraldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifRowTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifRowSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  heroCard: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroGlow: {
    position: 'absolute',
    top: -55,
    right: -35,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(226, 96, 61, 0.65)',
  },
  heroInner: {
    padding: spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    ...typography.label,
    fontFamily: monoFontFamily,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.85)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
  },
  heroSubLabel: {
    ...typography.bodySm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.md,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  heroAmountMain: {
    ...typography.display,
    fontSize: 36,
    color: colors.white,
  },
  heroAmountCents: {
    ...typography.h2,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 3,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xxs,
  },
  trendText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  waveWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    ...typography.h2,
    fontFamily: monoFontFamily,
    color: colors.white,
  },
  heroStatLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: spacing.sm,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  heroFooterText: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.white,
  },
  endDayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(225, 67, 92, 0.35)',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitleBold: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  addTableBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tablesCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tablesEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tablesEmptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tablesEmptyText: {
    ...typography.bodySm,
    color: colors.textMuted,
    flex: 1,
  },
  topItemsCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  topItemsEmpty: {
    backgroundColor: colors.surfaceElevated,
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
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    ...typography.caption,
    fontWeight: '800',
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
    backgroundColor: colors.coralMuted,
    overflow: 'hidden',
  },
  topItemBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.coral,
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
  endDayRevenueBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.emeraldMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.emeraldGlow,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  endDayRevenueLabel: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  endDayRevenueValue: {
    ...typography.display,
    fontFamily: monoFontFamily,
    fontSize: 30,
    color: colors.emerald,
    marginTop: spacing.xxs,
  },
  endDayConfirmSub: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
