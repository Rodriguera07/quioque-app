import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase';
import { Role } from '../types';

interface CreateOrgUserInput {
  orgId: string;
  createdByUid: string;
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

// Cria o usuário numa instância secundária e descartável do Firebase Auth,
// em vez de usar `auth` (a instância principal do app). O client SDK sempre
// troca a sessão "ativa" para quem acabou de ser criado — isolar isso numa
// segunda instância evita deslogar o admin. Assim não é preciso Cloud
// Function nem plano pago (Blaze) só para cadastrar um funcionário; as
// escritas no Firestore abaixo continuam autenticadas como o admin, na
// instância principal, e as regras exigem que ele seja admin da organização.
export async function createOrgUser({
  orgId,
  createdByUid,
  email,
  password,
  displayName,
  role,
}: CreateOrgUserInput): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password
    );
    await updateProfile(credential.user, { displayName: displayName.trim() });

    const uid = credential.user.uid;
    const nowIso = new Date().toISOString();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid), { orgId, role });
    batch.set(doc(db, 'organizations', orgId, 'users', uid), {
      uid,
      orgId,
      email: email.trim(),
      displayName: displayName.trim(),
      role,
      active: true,
      createdAt: nowIso,
      createdBy: createdByUid,
    });
    await batch.commit();

    return uid;
  } catch (err: any) {
    throw new Error(friendlyCreateUserError(err?.code ?? ''));
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

function friendlyCreateUserError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com esse e-mail.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'A senha precisa ter ao menos 6 caracteres.';
    default:
      return 'Não foi possível cadastrar o usuário. Tente novamente.';
  }
}
