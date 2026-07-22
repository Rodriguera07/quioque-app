import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, useDrawerProgress } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import ReanimatedAnimated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
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
  color: string;
  muted: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: DrawerItem[] = [
  { key: 'Dashboard', label: 'Painel', icon: 'grid-outline', color: colors.emerald, muted: colors.emeraldMuted },
  { key: 'Reports', label: 'Relatórios', icon: 'bar-chart-outline', color: colors.sand, muted: colors.sandMuted },
  {
    key: 'ClosedTablesHistory',
    label: 'Histórico de Mesas Fechadas',
    icon: 'time-outline',
    color: colors.primary,
    muted: colors.primaryMuted,
  },
  {
    key: 'UserManagement',
    label: 'Gerenciar Usuários',
    icon: 'people-outline',
    color: colors.coral,
    muted: colors.coralMuted,
    adminOnly: true,
  },
  {
    key: 'AuditLog',
    label: 'Log de Auditoria',
    icon: 'document-text-outline',
    color: colors.danger,
    muted: colors.dangerMuted,
    adminOnly: true,
  },
];

const ROLE_LABEL: Record<'admin' | 'staff', string> = {
  admin: 'Administrador',
  staff: 'Equipe',
};

// Cada linha entra com um leve fade + deslize, escalonado por índice e
// atrelado ao progresso real do gesto/mola do drawer (useDrawerProgress) —
// assim a entrada acompanha exatamente a suavidade da animação de abrir,
// em vez de rodar solta em paralelo.
function useStaggerStyle(index: number, total: number): ViewStyle {
  const progress = useDrawerProgress();
  const start = 0.15 + (index / total) * 0.5;
  const end = start + 0.4;
  return useAnimatedStyle(() => {
    const t = interpolate(progress.value, [start, end], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: t,
      transform: [{ translateX: interpolate(t, [0, 1], [-14, 0]) }],
    };
  }) as unknown as ViewStyle;
}

function DrawerNavRow({
  item,
  index,
  total,
  active,
  onPress,
}: {
  item: DrawerItem;
  index: number;
  total: number;
  active: boolean;
  onPress: () => void;
}) {
  const staggerStyle = useStaggerStyle(index, total);

  return (
    <ReanimatedAnimated.View style={staggerStyle}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={item.label}
        style={[styles.item, active && { backgroundColor: item.muted }]}
        onPress={onPress}
      >
        {active && <View style={[styles.itemAccent, { backgroundColor: item.color }]} />}
        <View style={[styles.itemIconWrap, { backgroundColor: active ? colors.surface : item.muted }]}>
          <Ionicons name={item.icon} size={18} color={item.color} />
        </View>
        <Text
          style={[styles.itemLabel, active && { color: item.color, fontWeight: '700' }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        {active && <Ionicons name="chevron-forward" size={16} color={item.color} />}
      </AnimatedPressable>
    </ReanimatedAnimated.View>
  );
}

export function AppDrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const activeRouteName = getActiveInnerRouteName(state);
  const initial = (user?.displayName ?? 'U').charAt(0).toUpperCase();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');
  const headerStyle = useStaggerStyle(-1, items.length);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={[colors.emerald, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTexture} pointerEvents="none">
          <View style={[styles.textureBubble, styles.textureBubbleLg]} />
          <View style={[styles.textureBubble, styles.textureBubbleSm]} />
        </View>

        <ReanimatedAnimated.View style={[styles.headerContent, headerStyle]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {user?.displayName ?? 'Usuário'}
          </Text>
          {user ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{ROLE_LABEL[user.role]}</Text>
            </View>
          ) : null}
        </ReanimatedAnimated.View>
      </LinearGradient>

      <View style={styles.itemsList}>
        {items.map((item, index) => {
          const active = activeRouteName === item.key;
          return (
            <DrawerNavRow
              key={item.key}
              item={item}
              index={index}
              total={items.length}
              active={active}
              onPress={() => {
                navigation.navigate('AppStack', { screen: item.key });
                navigation.closeDrawer();
              }}
            />
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
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </View>
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
    overflow: 'hidden',
  },
  headerTexture: {
    ...StyleSheet.absoluteFillObject,
  },
  textureBubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.white,
    opacity: 0.1,
  },
  textureBubbleLg: {
    width: 140,
    height: 140,
    top: -60,
    right: -40,
  },
  textureBubbleSm: {
    width: 70,
    height: 70,
    bottom: -20,
    left: -20,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarText: {
    ...typography.h2,
    color: colors.textInverse,
  },
  name: {
    ...typography.h3,
    color: colors.textInverse,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  roleBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
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
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  itemAccent: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
  },
  itemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
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
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '700',
  },
});
