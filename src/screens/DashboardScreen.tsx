import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { BeachUmbrellaIcon } from '../components/BeachUmbrellaIcon';
import { ConfirmModal } from '../components/ConfirmModal';
import { PulseDot } from '../components/PulseDot';
import { SubscriptionReminderBanner } from '../components/SubscriptionReminderBanner';
import { TableCard } from '../components/TableCard';
import { useAuthStore } from '../context/useAuthStore';
import {
  getClosedTablesToday,
  getOpenTables,
  getTableCurrentTotal,
  getTodayRevenue,
  getTopSellingItems,
  usePosStore,
} from '../context/usePosStore';
import { colors, elevationShadow, nunitoFontFamily, serifFontFamily, shape, spacing } from '../theme';
import { dashboardPalette } from '../theme/dashboardPalette';
import { TabScreenProps } from '../navigation/types';
import { getDaySummary } from '../services/firestoreOrg';
import { formatDateKey, formatTime } from '../utils/format';
import { useTick } from '../hooks/useTick';
import { useResponsiveContent, widthForColumns } from '../hooks/useResponsiveContent';

type Props = TabScreenProps<'Painel'>;

type EndDayDialog = 'blocked-open' | 'blocked-empty' | 'confirm' | null;

const TOP_ITEMS_COUNT = 3;
const SPARK_BAR_MAX_HEIGHT = 30;

const RANK_COLORS = [dashboardPalette.amber, dashboardPalette.teal500, dashboardPalette.inkSoft];

const QUICK_ACTIONS = [
  { key: 'abrir', icon: 'add' as const, label: 'Abrir mesa', color: dashboardPalette.teal700 },
  { key: 'pedido', icon: 'receipt-outline' as const, label: 'Novo pedido', color: dashboardPalette.amber },
  { key: 'receber', icon: 'cash-outline' as const, label: 'Receber', color: dashboardPalette.teal500 },
  { key: 'relatorios', icon: 'bar-chart-outline' as const, label: 'Relatórios', color: dashboardPalette.inkSoft },
];

function splitCurrencyParts(value: number): { main: string; cents: string } {
  const fixed = Math.max(0, value).toFixed(2);
  const [intPart, centsPart] = fixed.split('.');
  return { main: Number(intPart).toLocaleString('pt-BR'), cents: centsPart };
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
  // Faturamento dos 6 dias anteriores a hoje, para o gráfico de barras da
  // semana no card "Caixa do dia" — hoje é somado à parte pois é reativo.
  const [weekHistory, setWeekHistory] = useState<{ label: string; value: number }[] | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const mesasSectionY = useRef(0);

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
  const openTablesTotal = openTables.reduce((sum, t) => sum + getTableCurrentTotal(t), 0);
  const topItems = getTopSellingItems(tables, closedSalesToday, TOP_ITEMS_COUNT);
  const topMax = topItems[0]?.quantity ?? 1;
  const topTotalQty = topItems.reduce((sum, i) => sum + i.quantity, 0) || 1;

  useEffect(() => {
    if (!orgId) {
      setYesterdayRevenue(null);
      setWeekHistory(null);
      return;
    }
    let cancelled = false;
    const pastDays = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    Promise.all(pastDays.map((d) => getDaySummary(orgId, formatDateKey(d))))
      .then((summaries) => {
        if (cancelled) return;
        setYesterdayRevenue(summaries[5]?.totalRevenue ?? null);
        setWeekHistory(
          pastDays.map((d, i) => ({
            label: capitalize(d.toLocaleDateString('pt-BR', { weekday: 'narrow' })),
            value: summaries[i]?.totalRevenue ?? 0,
          }))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setYesterdayRevenue(null);
        setWeekHistory(null);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const trendPct =
    yesterdayRevenue && yesterdayRevenue > 0 ? ((revenue - yesterdayRevenue) / yesterdayRevenue) * 100 : null;

  const sparkDays = weekHistory
    ? [...weekHistory, { label: capitalize(new Date().toLocaleDateString('pt-BR', { weekday: 'narrow' })), value: revenue }]
    : null;
  const sparkMax = sparkDays ? Math.max(1, ...sparkDays.map((d) => d.value)) : 1;

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

  // "Novo pedido" e "Receber" dependem de escolher uma mesa primeiro — não
  // existe fluxo direto sem isso, então rolam até a seção de mesas abertas
  // (ou mandam abrir uma mesa, se não houver nenhuma).
  const handleQuickAction = (key: string) => {
    if (key === 'abrir') {
      navigation.navigate('OpenTable');
      return;
    }
    if (key === 'relatorios') {
      navigation.navigate('Relatorios');
      return;
    }
    if (openTables.length === 0) {
      navigation.navigate('OpenTable');
      return;
    }
    scrollRef.current?.scrollTo({ y: mesasSectionY.current, animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.menuButton}
          stateLayerColor={colors.onPrimaryContainer}
          accessibilityLabel="Abrir menu"
          accessibilityRole="button"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={20} color={colors.onPrimaryContainer} />
        </AnimatedPressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.greeting} numberOfLines={1}>
            Olá, {userName ?? 'Gerente'}
          </Text>
          <Text style={styles.date} numberOfLines={1}>
            {capitalize(dateLabel)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <AnimatedPressable
            style={styles.iconButton}
            stateLayerColor={colors.onSurface}
            accessibilityLabel="Notificações"
            onPress={() => setNotifOpen(true)}
          >
            <Ionicons name="notifications-outline" size={19} color={dashboardPalette.teal900} />
            {newTableNotifications.length > 0 && <View style={styles.notifDot} />}
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.iconButton}
            stateLayerColor={colors.onSurface}
            accessibilityLabel="Sair"
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={18} color={dashboardPalette.teal900} />
          </AnimatedPressable>
        </View>
      </View>

      {isAdmin && <SubscriptionReminderBanner />}

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[dashboardPalette.teal700, dashboardPalette.teal900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroAmbientGlow} pointerEvents="none" />

        <View style={styles.heroContent}>
          <View style={styles.caixaTopRow}>
            <Text style={styles.caixaLabel}>CAIXA DO DIA</Text>
            <View style={styles.statusPill}>
              <PulseDot color={dashboardPalette.mint} size={7} />
              <Text style={styles.statusPillText}>Aberto</Text>
            </View>
          </View>

          <Text style={styles.revenueCap}>Faturamento de hoje</Text>
          <View style={styles.revenueRow}>
            <Text style={styles.revenuePrefix}>R$</Text>
            <Text style={styles.revenueMain}>{revenueMain}</Text>
            <Text style={styles.revenueCents}>,{revenueCents}</Text>
          </View>
          {trendPct !== null && (
            <View
              style={[
                styles.trendChip,
                { backgroundColor: trendPct >= 0 ? 'rgba(74,222,155,0.15)' : 'rgba(224,91,111,0.15)' },
              ]}
            >
              <Ionicons
                name={trendPct >= 0 ? 'trending-up' : 'trending-down'}
                size={13}
                color={trendPct >= 0 ? dashboardPalette.mint : dashboardPalette.rose}
              />
              <Text
                style={[
                  styles.trendChipText,
                  { color: trendPct >= 0 ? dashboardPalette.mint : dashboardPalette.rose },
                ]}
              >
                {Math.abs(trendPct).toFixed(0)}% vs. ontem
              </Text>
            </View>
          )}

          {sparkDays && (
            <View style={styles.sparkRow}>
              {sparkDays.map((day, index) => {
                const isToday = index === sparkDays.length - 1;
                return (
                  <View key={index} style={styles.sparkCol}>
                    <View style={styles.sparkBarTrack}>
                      <View
                        style={[
                          styles.sparkBar,
                          isToday && styles.sparkBarToday,
                          { height: Math.max(3, (day.value / sparkMax) * SPARK_BAR_MAX_HEIGHT) },
                        ]}
                      />
                    </View>
                    <Text style={[styles.sparkLabel, isToday && styles.sparkLabelToday]}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.heroDivider} />

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <View style={styles.metricValueRow}>
                {openTables.length > 0 && <View style={styles.metricDot} />}
                <Text style={styles.metricValue} numberOfLines={1}>
                  {openTables.length}
                </Text>
              </View>
              <Text style={styles.metricLabel}>em atendimento</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricValue} numberOfLines={1}>
                {closedTables.length}
              </Text>
              <Text style={styles.metricLabel}>fechadas hoje</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricValue} numberOfLines={1}>
                R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.metricLabel}>ticket médio</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <AnimatedPressable
            key={action.key}
            style={styles.quickAction}
            stateLayerColor={action.color}
            onPress={() => handleQuickAction(action.key)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}1F` }]}>
              <Ionicons name={action.icon} size={17} color={action.color} />
            </View>
            <Text style={styles.quickActionLabel} numberOfLines={1}>
              {action.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Mais vendidos hoje</Text>
          <Text style={styles.sectionMeta}>Top {TOP_ITEMS_COUNT}</Text>
        </View>

        {topItems.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.emptyInline}>
              <Text style={styles.emptyInlineText}>Nenhum item vendido ainda hoje.</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.sellersCard]}>
            {topItems.map((item, index) => {
              const pct = Math.max(4, Math.round((item.quantity / topMax) * 100));
              const share = Math.round((item.quantity / topTotalQty) * 100);
              const rankColor = RANK_COLORS[index] ?? RANK_COLORS[RANK_COLORS.length - 1];
              return (
                <View key={item.menuItemId}>
                  {index > 0 && <View style={styles.sellerDivider} />}
                  <View style={styles.sellerRow}>
                    <View style={[styles.rank, { backgroundColor: `${rankColor}21` }]}>
                      <Text style={[styles.rankNumber, { color: rankColor }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.sellerBody}>
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.sellerBarRow}>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: rankColor }]} />
                        </View>
                        <Text style={styles.sellerShare}>{share}%</Text>
                      </View>
                    </View>
                    <Text style={styles.sellerQty}>
                      {item.quantity}
                      <Text style={styles.sellerQtyX}>×</Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View
        style={styles.section}
        onLayout={(e) => {
          mesasSectionY.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Mesas abertas</Text>
          <Text style={styles.sectionMeta}>
            {openTables.length} {openTables.length === 1 ? 'ativa' : 'ativas'}
          </Text>
        </View>

        <View style={[styles.card, styles.mesasCard]}>
          {openTables.length === 0 ? (
            <View style={styles.empty}>
              <LinearGradient
                colors={['#EAF6F3', '#DCEEEA']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.emptyIll}
              >
                <BeachUmbrellaIcon size={28} color={dashboardPalette.teal500} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Nenhuma mesa aberta</Text>
              <Text style={styles.emptyText}>
                Abra uma mesa para lançar pedidos e acompanhar o atendimento em tempo real.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.openTotalRow}>
                <Text style={styles.openTotalLabel}>Valor em aberto</Text>
                <Text style={styles.openTotalValue}>
                  R$ {openTablesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
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
            </>
          )}
        </View>
      </View>

      {isAdmin && (
        <AnimatedPressable style={styles.closeDay} stateLayerColor={colors.onSurface} onPress={handleEndDay}>
          <View style={styles.closeIcon}>
            <Ionicons name="lock-closed-outline" size={17} color={dashboardPalette.rose} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.closeTitle}>Encerrar o dia</Text>
            <Text style={styles.closeSub}>Fecha o caixa e zera o painel para amanhã</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
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
        iconColor={dashboardPalette.rose}
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
            R$ {revenueMain},{revenueCents}
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
                  stateLayerColor={colors.onSurface}
                  onPress={() => {
                    handleCloseNotif();
                    navigation.navigate('TableDetail', { tableId: table.id });
                  }}
                >
                  <View style={styles.notifRowIcon}>
                    <Ionicons name="restaurant-outline" size={16} color={dashboardPalette.teal700} />
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 6,
    paddingBottom: spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: shape.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontFamily: serifFontFamily.semiBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  date: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: shape.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: dashboardPalette.amber,
    borderWidth: 1.5,
    borderColor: colors.surface,
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
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: shape.large,
    overflow: 'hidden',
    ...elevationShadow(3),
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
    fontFamily: nunitoFontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  notifHeaderBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: spacing.xxs,
    backgroundColor: '#E4F1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeaderBadgeText: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 12,
    color: dashboardPalette.teal700,
  },
  notifEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  notifEmptyText: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 13,
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
    backgroundColor: '#E4F1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifRowTitle: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  notifRowSub: {
    fontFamily: nunitoFontFamily.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  heroCard: {
    position: 'relative',
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroAmbientGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(74,222,155,0.07)',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  caixaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caixaLabel: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.7)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: shape.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 12,
    color: colors.white,
  },
  revenueCap: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 4,
  },
  revenuePrefix: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 18,
    color: colors.white,
  },
  revenueMain: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 38,
    color: colors.white,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  revenueCents: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: shape.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 8,
  },
  trendChipText: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 12,
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 16,
    height: 44,
  },
  sparkCol: {
    flex: 1,
    alignItems: 'center',
  },
  sparkBarTrack: {
    width: '100%',
    height: SPARK_BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  sparkBar: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sparkBarToday: {
    backgroundColor: dashboardPalette.mint,
  },
  sparkLabel: {
    fontFamily: nunitoFontFamily.regular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.38)',
    marginTop: 5,
  },
  sparkLabelToday: {
    color: dashboardPalette.mint,
    fontFamily: nunitoFontFamily.bold,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.24)',
    marginTop: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  metricCol: {
    flex: 1,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: dashboardPalette.amber,
    marginRight: 6,
  },
  metricValue: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 19,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontFamily: nunitoFontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: shape.medium,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 10.5,
    color: colors.textPrimary,
    marginTop: 7,
    textAlign: 'center',
  },
  section: {
    marginTop: 22,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sectionMeta: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: shape.large,
    ...elevationShadow(1),
  },
  sellersCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
  },
  emptyInline: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyInlineText: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sellerDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 12,
  },
  sellerBody: {
    flex: 1,
  },
  sellerName: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  sellerBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 7,
  },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.surfaceHighlight,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  sellerShare: {
    fontFamily: nunitoFontFamily.medium,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  sellerQty: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sellerQtyX: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 12,
    color: colors.textMuted,
  },
  mesasCard: {
    padding: 14,
  },
  empty: {
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyIll: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 15.5,
    color: colors.textPrimary,
    marginBottom: 5,
  },
  emptyText: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 224,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  openTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  openTotalLabel: {
    fontFamily: nunitoFontFamily.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  openTotalValue: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 17,
    color: dashboardPalette.teal500,
  },
  closeDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: spacing.md,
    marginTop: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: shape.large,
    overflow: 'hidden',
    ...elevationShadow(1),
  },
  closeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${dashboardPalette.rose}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTitle: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  closeSub: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  endDayRevenueBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.emeraldMuted,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: colors.emeraldGlow,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  endDayRevenueLabel: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  endDayRevenueValue: {
    fontFamily: serifFontFamily.semiBold,
    fontSize: 28,
    color: colors.emerald,
    marginTop: spacing.xxs,
  },
  endDayConfirmSub: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
