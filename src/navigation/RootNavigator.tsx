import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../context/useAuthStore';
import { usePosStore } from '../context/usePosStore';
import { LoginScreen } from '../screens/LoginScreen';
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
    } else {
      usePosStore.getState().teardownOrgSync();
    }
  }, [uid, orgId, displayName]);

  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
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
  );
}
