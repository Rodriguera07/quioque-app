import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../context/useAuthStore';
import { RootStackParamList } from '../navigation/types';
import { subscribeAuditLog } from '../services/firestoreOrg';
import { colors, radius, spacing, typography } from '../theme';
import { AuditEventType, AuditLogEntry } from '../types';
import { formatDateLabel, formatTime } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AuditLog'>;

const EVENT_META: Record<AuditEventType, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  login: { label: 'Login', icon: 'log-in-outline' },
  logout: { label: 'Logout', icon: 'log-out-outline' },
  table_opened: { label: 'Abriu mesa', icon: 'add-circle-outline' },
  items_added: { label: 'Adicionou itens', icon: 'fast-food-outline' },
  table_closed: { label: 'Fechou mesa', icon: 'checkmark-done-circle-outline' },
  payment_recorded: { label: 'Registrou pagamento', icon: 'card-outline' },
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

export function AuditLogScreen({ navigation }: Props) {
  const orgId = useAuthStore((s) => s.user?.orgId ?? null);
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
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </AnimatedPressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="document-text-outline" title="Nenhum evento registrado ainda" />
        ) : (
          <View style={styles.card}>
            {filtered.map((entry, index) => {
              const meta = EVENT_META[entry.type];
              return (
                <View
                  key={entry.id}
                  style={[styles.row, index === filtered.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={meta.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>
                      {entry.userName} · {meta.label}
                    </Text>
                    <Text style={styles.rowSub}>
                      {formatDateLabel(entry.timestamp)} às {formatTime(entry.timestamp)}
                      {entry.tableLabel ? ` · Mesa ${entry.tableLabel}` : ''}
                      {entry.detail ? ` · ${entry.detail}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
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
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.sand,
    borderColor: colors.sand,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMuted,
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
