import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../context/useAuthStore';
import { RootStackParamList } from '../navigation/types';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { subscribeAuditLog } from '../services/firestoreOrg';
import { colors, monoFontFamily, radius, spacing, typography } from '../theme';
import { AuditEventType, AuditLogEntry } from '../types';
import { formatDateLabel, formatTime } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AuditLog'>;

const EVENT_META: Record<
  AuditEventType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; muted: string }
> = {
  login: { label: 'Login', icon: 'log-in-outline', color: colors.primary, muted: colors.primaryMuted },
  logout: { label: 'Logout', icon: 'log-out-outline', color: colors.textMuted, muted: colors.surfaceHighlight },
  table_opened: {
    label: 'Abriu mesa',
    icon: 'add-circle-outline',
    color: colors.emerald,
    muted: colors.emeraldMuted,
  },
  items_added: {
    label: 'Adicionou itens',
    icon: 'fast-food-outline',
    color: colors.sand,
    muted: colors.sandMuted,
  },
  table_closed: {
    label: 'Fechou mesa',
    icon: 'checkmark-done-circle-outline',
    color: colors.primary,
    muted: colors.primaryMuted,
  },
  payment_recorded: {
    label: 'Registrou pagamento',
    icon: 'card-outline',
    color: colors.coral,
    muted: colors.coralMuted,
  },
};

const FILTERS: { key: AuditEventType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'table_opened', label: 'Abriu mesa' },
  { key: 'items_added', label: 'Itens' },
  { key: 'table_closed', label: 'Fechou mesa' },
  { key: 'payment_recorded', label: 'Pagamento' },
  { key: 'login', label: 'Login/Logout' },
];

const PAGE_SIZE = 40;

function groupByDay(entries: AuditLogEntry[]): { label: string; entries: AuditLogEntry[] }[] {
  const groups: { label: string; entries: AuditLogEntry[] }[] = [];
  entries.forEach((entry) => {
    const label = formatDateLabel(entry.timestamp);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.entries.push(entry);
    } else {
      groups.push({ label, entries: [entry] });
    }
  });
  return groups;
}

export function AuditLogScreen({ navigation }: Props) {
  const orgId = useAuthStore((s) => s.user?.orgId ?? null);
  const { contentStyle } = useResponsiveContent();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [filter, setFilter] = useState<AuditEventType | 'all'>('all');

  useEffect(() => {
    if (!orgId) return;
    return subscribeAuditLog(orgId, pageSize, setEntries);
  }, [orgId, pageSize]);

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    if (filter === 'login') return entries.filter((e) => e.type === 'login' || e.type === 'logout');
    return entries.filter((e) => e.type === filter);
  }, [entries, filter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Log de Auditoria</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <AnimatedPressable
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[styles.filterText, filter === f.key && styles.filterTextActive]}
              numberOfLines={1}
            >
              {f.label}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="document-text-outline" title="Nenhum evento registrado ainda" />
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.card}>
                {group.entries.map((entry, index) => {
                  const meta = EVENT_META[entry.type];
                  return (
                    <View
                      key={entry.id}
                      style={[
                        styles.row,
                        index === group.entries.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={[styles.rowIcon, { backgroundColor: meta.muted }]}>
                        <Ionicons name={meta.icon} size={16} color={meta.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLabel} numberOfLines={1}>
                          {entry.userName}
                        </Text>
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {meta.label}
                          {entry.tableLabel ? ` · Mesa ${entry.tableLabel}` : ''}
                          {entry.detail ? ` · ${entry.detail}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.rowTime}>{formatTime(entry.timestamp)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {entries.length >= pageSize && (
          <AnimatedPressable style={styles.loadMoreBtn} onPress={() => setPageSize((n) => n + PAGE_SIZE)}>
            <Text style={styles.loadMoreText}>Carregar mais</Text>
          </AnimatedPressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
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
  filterRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  filterChip: {
    flexShrink: 0,
    minHeight: 36,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.sand,
    borderColor: colors.sand,
    shadowColor: colors.sand,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  group: {
    marginBottom: spacing.md,
  },
  groupLabel: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  rowTime: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    color: colors.textMuted,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadMoreText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '700',
  },
});
