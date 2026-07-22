import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// `getReactNativePersistence` existe no build de React Native do SDK (usado em
// runtime graças à condição "react-native" configurada em metro.config.js),
// mas o mapa de "exports" do pacote resolve os *tipos* de "firebase/auth"
// sempre para o d.ts genérico, que não declara essa função exclusiva de RN.
// Por isso o acesso é feito via require + cast em vez de um import nomeado.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getReactNativePersistence: (storage: unknown) => Persistence =
  require('firebase/auth').getReactNativePersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Configuração do Firebase ausente. Copie .env.example para .env e preencha as chaves EXPO_PUBLIC_FIREBASE_*.'
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Metro está configurado para preferir a condição "react-native" dos pacotes
// em todas as plataformas (ver metro.config.js), então o build RN do SDK de
// Auth também é o que roda no target web. Ainda assim, seguimos o padrão
// oficial do Firebase e inicializamos explicitamente por plataforma.
export const auth: Auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db: Firestore = initializeFirestore(app, {
  localCache: Platform.OS === 'web' ? memoryLocalCache() : persistentLocalCache(),
  // O app usa `campo?: string` (undefined) para "sem valor" em vários tipos
  // (ex.: Table.waiterName) — sem isso, gravar esses objetos direto lança
  // "Unsupported field value: undefined".
  ignoreUndefinedProperties: true,
});

export { app, firebaseConfig };
