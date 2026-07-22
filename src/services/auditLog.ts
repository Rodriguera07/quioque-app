import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditEventType } from '../types';

interface LogAuditEventInput {
  orgId: string;
  userId: string;
  userName: string;
  type: AuditEventType;
  tableId?: string;
  tableLabel?: string;
  detail?: string;
}

// Best-effort: uma falha ao registrar auditoria (ex.: sem conexão) nunca deve
// interromper a ação principal do usuário (login, abrir mesa, etc.).
export async function logAuditEvent({
  orgId,
  userId,
  userName,
  type,
  tableId,
  tableLabel,
  detail,
}: LogAuditEventInput): Promise<void> {
  try {
    await addDoc(collection(db, 'organizations', orgId, 'auditLog'), {
      type,
      userId,
      userName,
      tableId: tableId ?? null,
      tableLabel: tableLabel ?? null,
      detail: detail ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Falha ao registrar evento de auditoria', err);
  }
}
