import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { BeachUmbrellaIcon } from '../components/BeachUmbrellaIcon';
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
import { colors, nunitoFontFamily, radius, serifFontFamily, spacing } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { getDaySummary } from '../services/firestoreOrg';
import { formatDateKey, formatTime } from '../utils/format';
import { useTick } from '../hooks/useTick';
import { useResponsiveContent, widthForColumns } from '../hooks/useResponsiveContent';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type EndDayDialog = 'blocked-open' | 'blocked-empty' | 'confirm' | null;

const TOP_ITEMS_COUNT = 3;

// Paleta "sol se pondo sobre o mar" exclusiva do cartão "Caixa do Dia" —
// não faz parte do tema global porque só é usada aqui, igual à referência.
const HERO = {
  gradientStart: '#10938B',
  gradientEnd: '#0A5551',
  seaTeal900: '#0A5551',
  seaTeal700: '#0E857E',
  seaTeal500: '#18B0A2',
  liveDot: '#5CF0CE',
  trendGood: '#8DF3D6',
  sunLight: '#FFE7B8',
  sunMid: '#FFB65C',
  sun500: '#FF9E4D',
  sun600: '#EF7B36',
  ambientGlow: 'rgba(255,207,143,0.3)',
};

const RANK_STYLE = [
  { bg: '#FFE9C7', fg: HERO.sun600 },
  { bg: '#E4F1EF', fg: HERO.seaTeal700 },
  { bg: '#F6E7D9', fg: '#B07A47' },
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
        <AnimatedPressable
          style={styles.menuButtonWrap}
          accessibilityLabel="Abrir menu"
          accessibilityRole="button"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <LinearGradient
            colors={[HERO.seaTeal500, HERO.seaTeal700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.menuButton}
          >
            <Ionicons name="menu" size={20} color={colors.white} />
          </LinearGradient>
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
            accessibilityLabel="Notificações"
            onPress={() => setNotifOpen(true)}
          >
            <Ionicons name="notifications-outline" size={19} color={HERO.seaTeal900} />
            {newTableNotifications.length > 0 && <View style={styles.notifDot} />}
          </AnimatedPressable>
          <AnimatedPressable style={styles.iconButton} accessibilityLabel="Sair" onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={HERO.seaTeal900} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[HERO.gradientStart, HERO.gradientEnd]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroAmbientGlow} pointerEvents="none" />
        <View style={styles.heroSunWrap} pointerEvents="none">
          <LinearGradient
            colors={[HERO.sunLight, HERO.sunMid, HERO.sun500]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.heroSun}
          />
        </View>

        <View style={styles.heroTopContent}>
          <View style={styles.caixaTopRow}>
            <Text style={styles.caixaLabel}>CAIXA DO DIA</Text>
            <View style={styles.statusPill}>
              <PulseDot color={HERO.liveDot} size={7} />
              <Text style={styles.statusPillText}>Aberto</Text>
            </View>
          </View>

          <Text style={styles.revenueCap}>Faturamento de hoje</Text>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueMain}>{revenueMain}</Text>
            <Text style={styles.revenueCents}>,{revenueCents}</Text>
          </View>
          {trendPct !== null && (
            <View style={styles.revenueSubRow}>
              <Text style={styles.trendBold}>
                {trendPct >= 0 ? '↑' : '↓'} {Math.abs(trendPct).toFixed(0)}%
              </Text>
              <Text style={styles.trendRest}> em relação a ontem</Text>
            </View>
          )}
        </View>

        <View style={trendPct !== null ? styles.waveWrapWithTrend : styles.waveWrap}>
          <WaveDivider />
        </View>

        <View style={styles.seaStrip}>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{openTables.length}</Text>
              <Text style={styles.statLabel}>em atendimento</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{closedTables.length}</Text>
              <Text style={styles.statLabel}>fechadas hoje</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>
                R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.statLabel}>ticket médio</Text>
            </View>
          </View>
        </View>

        <AnimatedPressable style={styles.heroFooter} onPress={() => navigation.navigate('Reports')}>
          <Text style={styles.heroFooterText} numberOfLines={1}>
            Ver faturamento completo em Relatórios
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#EAFBF5" />
        </AnimatedPressable>
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
              const rank = RANK_STYLE[index] ?? RANK_STYLE[RANK_STYLE.length - 1];
              return (
                <View key={item.menuItemId} style={styles.sellerRow}>
                  <View style={[styles.rank, { backgroundColor: rank.bg }]}>
                    <Text style={[styles.rankNumber, { color: rank.fg }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.sellerBody}>
                    <Text style={styles.sellerName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={[HERO.sun500, HERO.sun600]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.barFill, { width: `${pct}%` }]}
                      />
                    </View>
                  </View>
                  <Text style={styles.sellerQty}>
                    {item.quantity}
                    <Text style={styles.sellerQtyX}>×</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Mesas abertas</Text>
          <Text style={styles.sectionMeta}>
            {openTables.length} {openTables.length === 1 ? 'ativa' : 'ativas'}
          </Text>
        </View>

        <View style={styles.card}>
          {openTables.length === 0 ? (
            <View style={styles.empty}>
              <LinearGradient
                colors={['#EAF6F3', '#DCEEEA']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.emptyIll}
              >
                <BeachUmbrellaIcon size={28} color={HERO.seaTeal500} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>Nenhuma mesa aberta</Text>
              <Text style={styles.emptyText}>
                Abra uma mesa para lançar pedidos e acompanhar o atendimento em tempo real.
              </Text>
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
      </View>

      {isAdmin && (
        <AnimatedPressable style={styles.closeDay} onPress={handleEndDay}>
          <View style={styles.closeIcon}>
            <Ionicons name="lock-closed-outline" size={17} color={HERO.sun600} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.closeTitle}>Encerrar o dia</Text>
            <Text style={styles.closeSub}>Fecha o caixa e zera o painel para amanhã</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
        </AnimatedPressable>
      )}

      </ScrollView>

      <AnimatedPressable
        style={styles.fabWrap}
        accessibilityLabel="Abrir nova mesa"
        onPress={() => navigation.navigate('OpenTable')}
      >
        <LinearGradient
          colors={['#FFAF5C', HERO.sun600]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </LinearGradient>
      </AnimatedPressable>

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
        iconColor={HERO.sun600}
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
                    <Ionicons name="restaurant-outline" size={16} color={HERO.seaTeal700} />
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
  menuButtonWrap: {
    borderRadius: 15,
    shadowColor: HERO.seaTeal700,
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: HERO.sun600,
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
    color: HERO.seaTeal700,
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
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: HERO.seaTeal900,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroAmbientGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: HERO.ambientGlow,
  },
  heroSunWrap: {
    position: 'absolute',
    top: 16,
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: HERO.sunMid,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  heroSun: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  heroTopContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  caixaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  caixaLabel: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 10.5,
    letterSpacing: 1.7,
    color: 'rgba(255,255,255,0.7)',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.full,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  statusPillText: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 12,
    color: '#EAFBF5',
  },
  revenueCap: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.78)',
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  revenueMain: {
    fontFamily: serifFontFamily.semiBold,
    fontSize: 36,
    color: colors.white,
    letterSpacing: -0.4,
  },
  revenueCents: {
    fontFamily: serifFontFamily.semiBold,
    fontSize: 21,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 2,
  },
  revenueSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendBold: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 12,
    color: HERO.trendGood,
  },
  trendRest: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  waveWrap: {
    marginTop: 16,
  },
  waveWrapWithTrend: {
    marginTop: 10,
  },
  seaStrip: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingTop: 2,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  statCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  statValue: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 19,
    color: colors.white,
  },
  statLabel: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.68)',
    marginTop: 5,
    lineHeight: 13,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.16)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    marginTop: 12,
    gap: spacing.xs,
  },
  heroFooterText: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 13,
    color: '#EAFBF5',
    flex: 1,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sellersCard: {
    padding: 6,
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
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 15,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontFamily: serifFontFamily.bold,
    fontSize: 13,
  },
  sellerBody: {
    flex: 1,
  },
  sellerName: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  barTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.surfaceHighlight,
    marginTop: 7,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
  },
  sellerQty: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sellerQtyX: {
    fontFamily: nunitoFontFamily.bold,
    fontSize: 11,
    color: colors.textMuted,
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
    padding: spacing.md,
  },
  closeDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: spacing.md,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  closeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FBEADF',
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
  fabWrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg + 2,
    shadowColor: HERO.sun600,
    shadowOpacity: 0.44,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
