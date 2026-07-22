import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';
import { AddItemsScreen } from '../screens/AddItemsScreen';
import { AuditLogScreen } from '../screens/AuditLogScreen';
import { CloseTableScreen } from '../screens/CloseTableScreen';
import { ClosedTableDetailScreen } from '../screens/ClosedTableDetailScreen';
import { ClosedTablesHistoryScreen } from '../screens/ClosedTablesHistoryScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EndDaySummaryScreen } from '../screens/EndDaySummaryScreen';
import { OpenTableScreen } from '../screens/OpenTableScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { TableDetailScreen } from '../screens/TableDetailScreen';
import { UserManagementScreen } from '../screens/UserManagementScreen';
import { colors } from '../theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// react-native-screens does not fully support native modal presentation on
// web (dismissed modals can be left mounted/hidden instead of unmounted),
// so fall back to a regular card push there.
const modalPresentation = Platform.OS === 'web' ? 'card' : 'modal';

export function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
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
      <Stack.Screen name="ClosedTablesHistory" component={ClosedTablesHistoryScreen} />
      <Stack.Screen name="ClosedTableDetail" component={ClosedTableDetailScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="AuditLog" component={AuditLogScreen} />
    </Stack.Navigator>
  );
}
