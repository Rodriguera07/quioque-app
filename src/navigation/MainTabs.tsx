import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
          height: 62,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: nunitoFontFamily.semiBold,
          fontSize: 10,
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name as keyof TabParamList} focused={focused} />,
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
        options={isAdmin ? undefined : { tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
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
});
