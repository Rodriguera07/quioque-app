import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, useDrawerProgress } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
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

const ROLE_ICON: Record<'admin' | 'staff', keyof typeof Ionicons.glyphMap> = {
  admin: 'shield-checkmark',
  staff: 'person',
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

function SectionLabel({ label, index, total }: { label: string; index: number; total: number }) {
  const style = useStaggerStyle(index, total);
  return (
    <ReanimatedAnimated.View style={style}>
      <Text style={styles.sectionLabel}>{label}</Text>
    </ReanimatedAnimated.View>
  );
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
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        style={[styles.item, active && [styles.itemActive, { backgroundColor: item.muted }]]}
        onPress={onPress}
      >
        {active && <View style={[styles.itemAccent, { backgroundColor: item.color }]} />}
        <View
          style={[
            styles.itemIconWrap,
            { backgroundColor: active ? colors.surface : item.muted },
            active && styles.itemIconWrapActive,
          ]}
        >
          <Ionicons name={item.icon} size={19} color={item.color} />
        </View>
        <Text
          style={[styles.itemLabel, active && { color: item.color, fontWeight: '700' }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={active ? item.color : colors.textMuted}
          style={{ opacity: active ? 1 : 0.4 }}
        />
      </AnimatedPressable>
    </ReanimatedAnimated.View>
  );
}

export function AppDrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const activeRouteName = getActiveInnerRouteName(state);
  const initial = (user?.displayName ?? 'U').charAt(0).toUpperCase();
  const mainItems = NAV_ITEMS.filter((item) => !item.adminOnly);
  const adminItems = NAV_ITEMS.filter((item) => item.adminOnly && user?.role === 'admin');
  const totalStagger = mainItems.length + adminItems.length + 1;
  const headerStyle = useStaggerStyle(-1, totalStagger);

  const navigateTo = (key: NoParamRoute) => {
    navigation.navigate('AppStack', { screen: key });
    navigation.closeDrawer();
  };

  return (
    <View style={styles.outer}>
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
            <View style={[styles.textureBubble, styles.textureBubbleXs]} />
          </View>

          <ReanimatedAnimated.View style={[styles.headerContent, headerStyle]}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {user?.displayName ?? 'Usuário'}
            </Text>
            {user?.email ? (
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
            {user ? (
              <View style={styles.roleBadge}>
                <Ionicons name={ROLE_ICON[user.role]} size={11} color={colors.textInverse} />
                <Text style={styles.roleBadgeText}>{ROLE_LABEL[user.role]}</Text>
              </View>
            ) : null}
          </ReanimatedAnimated.View>
        </LinearGradient>

        <View style={styles.itemsList}>
          <SectionLabel label="Menu" index={0} total={totalStagger} />
          <View style={{ gap: spacing.xxs, marginTop: spacing.xxs }}>
            {mainItems.map((item, index) => (
              <DrawerNavRow
                key={item.key}
                item={item}
                index={index + 1}
                total={totalStagger}
                active={activeRouteName === item.key}
                onPress={() => navigateTo(item.key)}
              />
            ))}
          </View>

          {adminItems.length > 0 && (
            <>
              <View style={styles.divider} />
              <SectionLabel
                label="Administração"
                index={mainItems.length + 1}
                total={totalStagger}
              />
              <View style={{ gap: spacing.xxs, marginTop: spacing.xxs }}>
                {adminItems.map((item, index) => (
                  <DrawerNavRow
                    key={item.key}
                    item={item}
                    index={mainItems.length + index + 2}
                    total={totalStagger}
                    active={activeRouteName === item.key}
                    onPress={() => navigateTo(item.key)}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <AnimatedPressable
            scaleTo={0.97}
            accessibilityRole="button"
            accessibilityLabel="Sair"
            style={styles.logoutBtn}
            onPress={logout}
          >
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={17} color={colors.danger} />
            </View>
            <Text style={styles.logoutText}>Sair</Text>
          </AnimatedPressable>
          <Text style={styles.version}>Quiosque PDV</Text>
        </View>
      </SafeAreaView>
    </View>
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
  // Container externo sem recorte: carrega a sombra flutuante do painel.
  // O recorte de cantos arredondados (para o gradiente do header não
  // vazar quadrado) acontece só no SafeAreaView interno.
  outer: {
    flex: 1,
    borderTopRightRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopRightRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
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
    width: 150,
    height: 150,
    top: -70,
    right: -50,
  },
  textureBubbleSm: {
    width: 80,
    height: 80,
    bottom: -25,
    left: -25,
  },
  textureBubbleXs: {
    width: 36,
    height: 36,
    top: 20,
    left: 10,
    opacity: 0.14,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  avatarText: {
    ...typography.h1,
    color: colors.textInverse,
  },
  name: {
    ...typography.h3,
    color: colors.textInverse,
    textAlign: 'center',
  },
  email: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
    maxWidth: '100%',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
    marginHorizontal: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  itemActive: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemAccent: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 3,
  },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconWrapActive: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  itemLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerMuted,
  },
  logoutIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '700',
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
