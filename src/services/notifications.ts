import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAdminPushTokens, setUserPushToken } from './firestoreOrg';

// Sem isso, uma notificação que chega com o app aberto em primeiro plano
// nunca aparece (o padrão do SDK é não exibir banner/lista nesse caso).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Best-effort: sem servidor próprio, cada dispositivo registra seu token
// direto no perfil do próprio usuário. Falhar aqui (permissão negada, web,
// emulador sem Google Play Services) nunca deve impedir o login.
export async function registerForPushNotificationsAsync(
  orgId: string,
  uid: string
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let status = existingStatus;
    if (status !== 'granted') {
      const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
      status = requestedStatus;
    }
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await setUserPushToken(orgId, uid, token);
  } catch (err) {
    console.warn('[notifications] Falha ao registrar push token', err);
  }
}

// Envia direto para a API do Expo Push (sem backend próprio) para todo
// admin ativo da organização.
export async function notifyAdmins(orgId: string, title: string, body: string): Promise<void> {
  try {
    const tokens = await getAdminPushTokens(orgId);
    if (tokens.length === 0) return;

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        tokens.map((to) => ({ to, title, body, sound: 'default' }))
      ),
    });

    // O Expo Push API responde 200 mesmo quando um envio individual falha
    // (token expirado, credencial FCM/APNs ausente etc.) — o erro real vem
    // dentro do corpo, por ticket. Sem checar isso, uma falha de entrega
    // nunca aparecia em lugar nenhum, nem no log.
    const data = (await res.json().catch(() => null)) as {
      data?: Array<{ status: string; message?: string; details?: unknown }>;
    } | null;
    data?.data?.forEach((ticket, i) => {
      if (ticket.status === 'error') {
        console.warn(`[notifications] Push para ${tokens[i]} falhou:`, ticket.message, ticket.details);
      }
    });
  } catch (err) {
    console.warn('[notifications] Falha ao notificar admins', err);
  }
}
