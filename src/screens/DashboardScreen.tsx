import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { ConfirmModal } from '../components/ConfirmModal';
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
import { formatCurrency, formatTime } from '../utils/format';
import { useTick } from '../hooks/useTick';
import { useResponsiveContent, widthForColumns } from '../hooks/useResponsiveContent';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type EndDayDialog = 'blocked-open' | 'blocked-empty' | 'confirm' | null;

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

  const userName = useAuthStore((s) => s.user?.displayName ?? null);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const logout = useAuthStore((s) => s.logout);

  const tables = usePosStore((s) => s.tables);
  const closedSalesToday = usePosStore((s) => s.closedSalesToday);
  const endDay = usePosStore((s) => s.endDay);

  const openTables = getOpenTables(tables);
  const closedTables = getClosedTablesToday(tables);
  const revenue = getTodayRevenue(closedSalesToday);
  const topItems = getTopSellingItems(tables, closedSalesToday, 5);
  const topMax = topItems[0]?.quantity ?? 1;

  const newTableNotifications = useMemo(
    () =>
      openTables
        .filter((t) => t.openedAt > notifSeenAt)
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
    [openTables, notifSeenAt]
  );
  const avgTicket = closedTables.length > 0 ? revenue / closedTables.length : 0;

  const today = new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const initial = (userName ?? 'G').charAt(0).toUpperCase();

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
            <Ionicons name="menu" size={24} color={colors.textInverse} />
          </AnimatedPressable>
          <LinearGradient
            colors={[colors.emerald, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
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

      <View style={styles.receipt}>
        <View style={styles.receiptTopRow}>
          <Text style={styles.receiptLabel}>RESUMO DO CAIXA</Text>
          <View style={styles.statusPill}>
            <PulseDot size={6} />
            <Text style={styles.statusText}>caixa aberto</Text>
          </View>
        </View>

        <AnimatedPressable
          style={styles.revenueLinkRow}
          onPress={() => navigation.navigate('Reports')}
        >
          <Ionicons name="receipt-outline" size={16} color={colors.textMuted} />
          <Text style={styles.revenueLinkText}>Ver faturamento em Relatórios</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </AnimatedPressable>

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

      <AnimatedPressable style={styles.fabWrap} onPress={() => navigation.navigate('OpenTable')}>
        <Ionicons name="add" size={22} color={colors.textInverse} />
        <Text style={styles.fabLabel}>Abrir Nova Mesa</Text>
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
          <Text style={styles.endDayRevenueValue}>{formatCurrency(revenue)}</Text>
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
  headerTextWrap: {
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
  revenueLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  revenueLinkText: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.textSecondary,
    flex: 1,
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
