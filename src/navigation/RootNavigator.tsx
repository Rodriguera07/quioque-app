import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { AdminNotificationToasts } from '../components/AdminNotificationToasts';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuthStore } from '../context/useAuthStore';
import { usePosStore } from '../context/usePosStore';
import { LoginScreen } from '../screens/LoginScreen';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { colors } from '../theme';
import { AppDrawer } from './AppDrawer';

type RootParamList = {
  Login: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootParamList>();

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const uid = useAuthStore((s) => s.user?.uid);
  const orgId = useAuthStore((s) => s.user?.orgId);
  const displayName = useAuthStore((s) => s.user?.displayName);

  useEffect(() => {
    if (uid && orgId && displayName) {
      usePosStore.getState().initOrgSync(orgId, { uid, displayName });
      registerForPushNotificationsAsync(orgId, uid);
    } else {
      usePosStore.getState().teardownOrgSync();
    }
  }, [uid, orgId, displayName]);

  if (status === 'loading') {
    return <LoadingScreen message="Restaurando sua sessão…" />;
  }

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {status === 'unauthenticated' ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={AppDrawer} />
        )}
      </Stack.Navigator>
      {status === 'authenticated' && <AdminNotificationToasts />}
    </>
  );
}
