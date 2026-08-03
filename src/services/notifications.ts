import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';
import { getAdminPushTokens, setUserPushToken, setUserWebPushSubscription } from './firestoreOrg';

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

// applicationServerKey do PushManager precisa de Uint8Array, não da string
// base64url que a VAPID key vem — conversão padrão recomendada pela MDN.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

// Web Push é um mecanismo totalmente diferente do push nativo (Expo/FCM):
// não passa pelo Expo Push API, precisa de Service Worker + chave VAPID, e
// quem entrega de fato é a função serverless (ver /api/send-web-push), não
// o próprio Expo. No Safari/iOS só funciona depois de "Adicionar à Tela de
// Início" (PWA instalada) — numa aba comum o navegador nem expõe a API.
async function registerForWebPushAsync(orgId: string, uid: string): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }
  const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/sw.js');
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    await setUserWebPushSubscription(orgId, uid, {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
  } catch (err) {
    console.warn('[notifications] Falha ao registrar web push', err);
  }
}

// Best-effort: sem servidor próprio de estado, cada dispositivo registra seu
// token/assinatura direto no perfil do próprio usuário. Falhar aqui
// (permissão negada, navegador sem suporte, emulador sem Google Play
// Services) nunca deve impedir o login.
export async function registerForPushNotificationsAsync(
  orgId: string,
  uid: string
): Promise<void> {
  if (Platform.OS === 'web') {
    await registerForWebPushAsync(orgId, uid);
    return;
  }
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

// Push nativo (iOS/Android) via Expo Push API direto do cliente — sem
// backend próprio, cada admin ativo da organização recebe.
async function sendExpoPush(orgId: string, title: string, body: string): Promise<void> {
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
    console.warn('[notifications] Falha ao notificar admins (nativo)', err);
  }
}

// Web push passa pela função serverless (só ela tem a VAPID private key) —
// o cliente só repassa orgId/título/corpo com seu ID token pra autenticar.
async function sendWebPush(orgId: string, title: string, body: string): Promise<void> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiBase) return;

  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;

    const res = await fetch(`${apiBase}/api/send-web-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ orgId, title, body }),
    });
    if (!res.ok) {
      console.warn('[notifications] Falha ao notificar admins (web)', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[notifications] Falha ao notificar admins (web)', err);
  }
}

// Dispara os dois canais em paralelo — cada um alcança só quem de fato tem
// aquele tipo de assinatura registrada (nativo ou web), então não há
// duplicidade: um mesmo admin nunca tem os dois tokens ao mesmo tempo.
export async function notifyAdmins(orgId: string, title: string, body: string): Promise<void> {
  await Promise.all([sendExpoPush(orgId, title, body), sendWebPush(orgId, title, body)]);
}
