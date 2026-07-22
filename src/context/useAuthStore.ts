import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { create } from 'zustand';
import { auth, db } from '../config/firebase';
import { usePosStore } from './usePosStore';
import { logAuditEvent } from '../services/auditLog';
import { UserProfile } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// Ponteiro global uid -> { orgId, role } em `users/{uid}`.
interface UserPointer {
  orgId: string;
  role: UserProfile['role'];
}

async function fetchPointer(uid: string): Promise<UserPointer | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserPointer) : null;
}

async function fetchOrgProfile(orgId: string, uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'organizations', orgId, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um instante e tente novamente.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

// Assinatura viva do perfil (org + role + active) do usuário logado, para que
// mudanças feitas por um admin (ex.: desativar a conta) se reflitam na hora.
let profileUnsubscribe: Unsubscribe | null = null;

function watchProfile(uid: string, orgId: string) {
  profileUnsubscribe?.();
  profileUnsubscribe = onSnapshot(doc(db, 'organizations', orgId, 'users', uid), (snap) => {
    if (!snap.exists()) {
      useAuthStore.setState({ status: 'unauthenticated', user: null });
      return;
    }
    const profile = snap.data() as UserProfile;
    if (!profile.active) {
      profileUnsubscribe?.();
      profileUnsubscribe = null;
      signOut(auth);
      return;
    }
    useAuthStore.setState({ status: 'authenticated', user: profile });
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,

  login: async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const pointer = await fetchPointer(credential.user.uid);
      if (!pointer) {
        await signOut(auth);
        return { ok: false, error: 'Usuário sem organização vinculada. Fale com o admin.' };
      }
      const profile = await fetchOrgProfile(pointer.orgId, credential.user.uid);
      if (!profile || !profile.active) {
        await signOut(auth);
        return { ok: false, error: 'Conta desativada. Fale com o admin.' };
      }
      await logAuditEvent({
        orgId: profile.orgId,
        userId: profile.uid,
        userName: profile.displayName,
        type: 'login',
      });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: friendlyAuthError(err?.code ?? '') };
    }
  },

  logout: async () => {
    const { user } = get();
    if (user) {
      await logAuditEvent({
        orgId: user.orgId,
        userId: user.uid,
        userName: user.displayName,
        type: 'logout',
      });
    }
    profileUnsubscribe?.();
    profileUnsubscribe = null;
    usePosStore.getState().teardownOrgSync();
    await signOut(auth);
  },
}));

// Restaura a sessão ao abrir o app e mantém org/role sincronizados enquanto
// o usuário estiver logado. Chamado uma única vez (ver App.tsx).
export function initAuthListener(): Unsubscribe {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      profileUnsubscribe?.();
      profileUnsubscribe = null;
      useAuthStore.setState({ status: 'unauthenticated', user: null });
      return;
    }
    const pointer = await fetchPointer(firebaseUser.uid);
    if (!pointer) {
      await signOut(auth);
      useAuthStore.setState({ status: 'unauthenticated', user: null });
      return;
    }
    watchProfile(firebaseUser.uid, pointer.orgId);
  });
}
