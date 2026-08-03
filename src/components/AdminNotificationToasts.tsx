import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../context/useAuthStore';
import { AUDIT_EVENT_META } from '../data/auditEvents';
import { subscribeAuditLog } from '../services/firestoreOrg';
import { colors, nunitoFontFamily, radius, shadows, spacing, typography } from '../theme';
import { AuditEventType, AuditLogEntry } from '../types';

// Mesmos eventos que já disparam push (ver notifyAdmins em usePosStore) —
// aqui é o aviso "de dentro do app": não depende de token push registrado
// nem funciona só em build nativo, então cobre também a versão web e o
// instante em que o push ainda não chegou.
const TOASTABLE_TYPES: AuditEventType[] = [
  'table_opened',
  'items_added',
  'payment_recorded',
  'table_closed',
];

const VISIBLE_MS = 4500;

export function AdminNotificationToasts() {
  const user = useAuthStore((s) => s.user);
  const [toast, setToast] = useState<AuditLogEntry | null>(null);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  const queueRef = useRef<AuditLogEntry[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstSnapshotRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    seenIdsRef.current = new Set();
    isFirstSnapshotRef.current = true;
    queueRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);

    if (!user || user.role !== 'admin') return;

    const showNext = () => {
      const next = queueRef.current.shift();
      setToast(next ?? null);
      timerRef.current = next ? setTimeout(showNext, VISIBLE_MS) : null;
    };

    const unsubscribe = subscribeAuditLog(user.orgId, 8, (entries) => {
      // Primeira leitura é o estado atual do log (histórico), não eventos
      // novos — sem essa marca, todo admin levaria uma enxurrada de toasts
      // de coisas antigas assim que abrisse o app.
      if (isFirstSnapshotRef.current) {
        entries.forEach((e) => seenIdsRef.current.add(e.id));
        isFirstSnapshotRef.current = false;
        return;
      }

      const fresh = entries.filter(
        (e) =>
          !seenIdsRef.current.has(e.id) &&
          e.userId !== user.uid &&
          TOASTABLE_TYPES.includes(e.type)
      );
      if (fresh.length === 0) return;

      fresh.forEach((e) => seenIdsRef.current.add(e.id));
      // `entries` vem mais-novo-primeiro; empilha na ordem em que aconteceram.
      queueRef.current.push(...fresh.reverse());
      if (!timerRef.current) showNext();
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.orgId, user?.uid, user?.role]);

  useEffect(() => {
    Animated.spring(anim, {
      toValue: toast ? 1 : 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [toast, anim]);

  if (!toast) return null;
  const meta = AUDIT_EVENT_META[toast.type];

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + spacing.sm }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
            ],
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.muted }]}>
          <Ionicons name={meta.icon} size={16} color={meta.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {toast.userName}
          </Text>
          <Text style={styles.detail} numberOfLines={2}>
            {meta.label}
            {toast.tableLabel ? ` · Mesa ${toast.tableLabel}` : ''}
            {toast.detail ? ` · ${toast.detail}` : ''}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  name: {
    ...typography.bodySm,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textPrimary,
  },
  detail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
});
