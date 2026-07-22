import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../context/useAuthStore';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from './types';

type NoParamRoute = {
  [K in keyof RootStackParamList]: RootStackParamList[K] extends undefined ? K : never;
}[keyof RootStackParamList];

interface DrawerItem {
  key: NoParamRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  adminOnly?: boolean;
}

const NAV_ITEMS: DrawerItem[] = [
  { key: 'Dashboard', label: 'Painel', icon: 'grid-outline' },
  { key: 'Reports', label: 'Relatórios', icon: 'bar-chart-outline' },
  { key: 'ClosedTablesHistory', label: 'Histórico de Mesas Fechadas', icon: 'time-outline' },
  { key: 'UserManagement', label: 'Gerenciar Usuários', icon: 'people-outline', adminOnly: true },
  { key: 'AuditLog', label: 'Log de Auditoria', icon: 'document-text-outline', adminOnly: true },
];

const ROLE_LABEL: Record<'admin' | 'staff', string> = {
  admin: 'Administrador',
  staff: 'Equipe',
};

export function AppDrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const activeRouteName = getActiveInnerRouteName(state);
  const initial = (user?.displayName ?? 'U').charAt(0).toUpperCase();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.emerald, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </LinearGradient>
        <Text style={styles.name} numberOfLines={1}>
          {user?.displayName ?? 'Usuário'}
        </Text>
        {user ? (
          <View style={[styles.roleBadge, user.role === 'admin' && styles.roleBadgeAdmin]}>
            <Text style={[styles.roleBadgeText, user.role === 'admin' && styles.roleBadgeTextAdmin]}>
              {ROLE_LABEL[user.role]}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.itemsList}>
        {items.map((item) => {
          const active = activeRouteName === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
              onPress={() => navigation.navigate('AppStack', { screen: item.key })}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair"
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.itemPressed]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// O state da Drawer.Navigator só sabe o nome da rota filha ("AppStack"); o
// nome da tela ativa de fato mora dentro do state aninhado da native-stack.
function getActiveInnerRouteName(state: DrawerContentComponentProps['state']): string | undefined {
  const drawerRoute = state.routes[state.index];
  const nested = drawerRoute.state;
  if (!nested || nested.index == null) return undefined;
  return nested.routes[nested.index]?.name;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    ...typography.h2,
    color: colors.textInverse,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHighlight,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.sandMuted,
  },
  roleBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleBadgeTextAdmin: {
    color: colors.sand,
  },
  itemsList: {
    flex: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  itemActive: {
    backgroundColor: colors.primaryMuted,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  itemLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  logoutText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '700',
  },
});
