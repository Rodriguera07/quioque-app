import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { AppDrawerContent } from './AppDrawerContent';
import { AppStack } from './AppStack';
import { colors } from '../theme';
import { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

export function AppDrawer() {
  const { width } = useWindowDimensions();
  // Painel largo o bastante para respirar, mas nunca a ponto de esconder toda
  // a tela em aparelhos pequenos; em tablets, um teto fixo evita que o menu
  // fique absurdamente largo. useWindowDimensions recalcula em rotação/resize.
  const drawerWidth = Math.min(360, width * 0.84);

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: colors.overlay,
        drawerStyle: { width: drawerWidth },
        swipeEdgeWidth: 60,
      }}
      drawerContent={(props) => <AppDrawerContent {...props} />}
    >
      <Drawer.Screen name="AppStack" component={AppStack} />
    </Drawer.Navigator>
  );
}
