import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import webpush from 'web-push';

// Roda uma vez por instância fria da função (Vercel reaproveita entre
// invocações "quentes"), não a cada request.
if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
}

const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:rodrigodantas0495@hotmail.com', vapidPublicKey, vapidPrivateKey);
}

interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// Entrega Web Push (Chrome/Android/Safari-PWA) para os admins ativos de uma
// organização. Existe porque enviar Web Push exige assinar a mensagem com a
// VAPID private key — uma chave que nunca pode ir para o cliente, então o
// envio em si só pode acontecer aqui, não em usePosStore/notifications.ts
// (que é onde o push nativo via Expo já é enviado direto do cliente).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  if (!getApps().length || !vapidPublicKey || !vapidPrivateKey) {
    console.warn('[send-web-push] credenciais ausentes (service account ou VAPID)');
    res.status(500).json({ error: 'server not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  const { orgId, title, body } = (req.body ?? {}) as { orgId?: string; title?: string; body?: string };

  if (!idToken || !orgId || !title || !body) {
    res.status(400).json({ error: 'missing token, orgId, title or body' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    const db = getFirestore();

    // Confirma que quem chamou é de fato membro dessa orgId antes de expor
    // qualquer dado dela — sem isso, qualquer usuário autenticado (de
    // qualquer organização) poderia mandar notificação para os admins de
    // uma organização alheia só sabendo o orgId.
    const pointer = await db.doc(`users/${decoded.uid}`).get();
    if (!pointer.exists || pointer.data()?.orgId !== orgId) {
      res.status(403).json({ error: 'not a member of this organization' });
      return;
    }

    const usersSnap = await db
      .collection(`organizations/${orgId}/users`)
      .where('role', '==', 'admin')
      .where('active', '==', true)
      .get();

    const subscriptions = usersSnap.docs
      .map((d) => d.data().webPushSubscription as WebPushSubscription | undefined)
      .filter((sub): sub is WebPushSubscription => !!sub?.endpoint);

    const payload = JSON.stringify({ title, body });
    const results = await Promise.allSettled(
      subscriptions.map((sub) => webpush.sendNotification(sub, payload))
    );

    const failures = results.filter((r) => r.status === 'rejected');
    failures.forEach((r) => {
      if (r.status === 'rejected') console.warn('[send-web-push] envio falhou', r.reason);
    });

    res.status(200).json({ sent: results.length - failures.length, failed: failures.length });
  } catch (err) {
    console.warn('[send-web-push] erro', err);
    res.status(500).json({ error: 'internal error' });
  }
}
