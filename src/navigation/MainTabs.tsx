import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../context/useAuthStore';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MenuManagementScreen } from '../screens/MenuManagementScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { TablesScreen } from '../screens/TablesScreen';
import { colors, nunitoFontFamily } from '../theme';
import { dashboardPalette } from '../theme/dashboardPalette';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

// Emojis simples, sem tingimento por cor — igual ao mock de referência, em
// vez de um ícone sólido tingido por aba (ficava "colorido" demais).
const TAB_EMOJI: Record<keyof TabParamList, string> = {
  Painel: '▦',
  Mesas: '🍽',
  Produtos: '📦',
  Relatorios: '📈',
};

function TabIcon({ name, focused }: { name: keyof TabParamList; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconEmoji}>{TAB_EMOJI[name]}</Text>
    </View>
  );
}

// Barra de abas fixa (Painel / Mesas / Produtos / Relatórios) — navegação
// principal do app, igual ao mock de referência. "Produtos" (cardápio) só
// aparece para admin, mesma restrição que já existia no menu lateral.
export function MainTabs() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  // Barra de gestos do Android / indicador home do iPhone reservam uma faixa
  // que varia por aparelho — uma altura fixa cortava os ícones/labels em
  // telas com esse inset maior. `insets.bottom` cresce a barra na medida
  // exata que cada aparelho precisa.
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = Math.max(8, insets.bottom);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: dashboardPalette.teal700,
        tabBarInactiveTintColor: colors.textSecondary,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: 56 + tabBarBottomPadding,
          paddingTop: 6,
          paddingBottom: tabBarBottomPadding,
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name as keyof TabParamList} focused={focused} />,
        // Em telas estreitas (~320-360px), 4 abas deixam pouco espaço por
        // label — sem limitar a 1 linha, "Relatórios" quebrava e ficava
        // cortado pela altura fixa da barra.
        tabBarLabel: ({ color, children }) => (
          <Text numberOfLines={1} style={[styles.label, { color }]}>
            {children}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Painel" component={DashboardScreen} />
      <Tab.Screen name="Mesas" component={TablesScreen} />
      <Tab.Screen
        name="Produtos"
        component={MenuManagementScreen}
        // O papel do usuário pode mudar em tempo real (outro admin o
        // rebaixa durante a sessão) — desmontar/remontar a Screen nesse
        // momento não é suportado pelo React Navigation, então a aba
        // sempre existe e só o botão/gesto de acesso é ocultado.
        options={{
          title: 'Cardápio',
          ...(isAdmin ? null : { tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }),
        }}
      />
      <Tab.Screen name="Relatorios" component={ReportsScreen} options={{ title: 'Relatórios' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 1,
    borderRadius: 999,
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: `${dashboardPalette.teal700}1F`,
  },
  iconEmoji: {
    fontSize: 19,
    lineHeight: 22,
  },
  label: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 10,
    textAlign: 'center',
  },
});
