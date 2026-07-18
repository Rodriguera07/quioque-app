import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../context/useAuthStore';
import { AddItemsScreen } from '../screens/AddItemsScreen';
import { CloseTableScreen } from '../screens/CloseTableScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EndDaySummaryScreen } from '../screens/EndDaySummaryScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OpenTableScreen } from '../screens/OpenTableScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { TableDetailScreen } from '../screens/TableDetailScreen';
import { colors } from '../theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// react-native-screens does not fully support native modal presentation on
// web (dismissed modals can be left mounted/hidden instead of unmounted),
// so fall back to a regular card push there.
const modalPresentation = Platform.OS === 'web' ? 'card' : 'modal';

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen
            name="OpenTable"
            component={OpenTableScreen}
            options={{ presentation: modalPresentation }}
          />
          <Stack.Screen name="TableDetail" component={TableDetailScreen} />
          <Stack.Screen
            name="AddItems"
            component={AddItemsScreen}
            options={{ presentation: modalPresentation }}
          />
          <Stack.Screen
            name="CloseTable"
            component={CloseTableScreen}
            options={{ presentation: modalPresentation }}
          />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen
            name="EndDaySummary"
            component={EndDaySummaryScreen}
            options={{ presentation: modalPresentation, gestureEnabled: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
