import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuditLogEntry, ClosedSale, PaymentMethod, Table, UserProfile } from '../types';
import { computeTotals, isPaidInFull } from '../utils/billing';

const tablesCol = (orgId: string) => collection(db, 'organizations', orgId, 'tables');
const closedSalesCol = (orgId: string) => collection(db, 'organizations', orgId, 'closedSales');
const orgUsersCol = (orgId: string) => collection(db, 'organizations', orgId, 'users');
const auditLogCol = (orgId: string) => collection(db, 'organizations', orgId, 'auditLog');
const daySummaryDoc = (orgId: string, date: string) =>
  doc(db, 'organizations', orgId, 'daySummaries', date);

// Sem isso, um listener que cai (permissão revogada, doc apagado, conexão
// instável) simplesmente para de atualizar a tela sem nenhum aviso — o app
// fica com dado desatualizado e ninguém percebe o motivo.
function logSnapshotError(label: string) {
  return (err: unknown) => console.warn(`[firestore] listener "${label}" falhou`, err);
}

export function newTableId(orgId: string): string {
  return doc(tablesCol(orgId)).id;
}

export function setTable(orgId: string, table: Table): Promise<void> {
  return setDoc(doc(tablesCol(orgId), table.id), table);
}

export function updateTable(orgId: string, tableId: string, patch: Partial<Table>): Promise<void> {
  return updateDoc(doc(tablesCol(orgId), tableId), patch);
}

export function subscribeTables(orgId: string, cb: (tables: Table[]) => void): Unsubscribe {
  return onSnapshot(
    tablesCol(orgId),
    (snap) => cb(snap.docs.map((d) => d.data() as Table)),
    logSnapshotError('tables')
  );
}

export function subscribeClosedSalesSince(
  orgId: string,
  sinceIso: string,
  cb: (sales: ClosedSale[]) => void
): Unsubscribe {
  const q = query(
    closedSalesCol(orgId),
    where('closedAt', '>=', sinceIso),
    orderBy('closedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => d.data() as ClosedSale)),
    logSnapshotError('closedSalesSince')
  );
}

export function subscribeClosedSalesRange(
  orgId: string,
  fromIso: string,
  toIso: string,
  cb: (sales: ClosedSale[]) => void
): Unsubscribe {
  const q = query(
    closedSalesCol(orgId),
    where('closedAt', '>=', fromIso),
    where('closedAt', '<=', toIso),
    orderBy('closedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => d.data() as ClosedSale)),
    logSnapshotError('closedSalesRange')
  );
}

export type CloseTableResult = 'ok' | 'not-open' | 'not-found' | 'unpaid';

// Fecha a mesa dentro de uma transação: revalida no servidor que ela ainda
// está aberta e está totalmente paga antes de gravar (mesas sem nenhum item
// já estão "pagas" por não terem valor a cobrar) — evita que dois
// dispositivos fechem a mesma mesa duas vezes caso ambos estivessem offline
// e reconectem quase ao mesmo tempo.
export async function closeTableTransaction(
  orgId: string,
  tableId: string,
  saleId: string,
  closedBy: { userId: string; userName: string }
): Promise<CloseTableResult> {
  const tableRef = doc(tablesCol(orgId), tableId);
  const saleRef = doc(closedSalesCol(orgId), saleId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(tableRef);
    if (!snap.exists()) return 'not-found';
    const table = snap.data() as Table;
    if (table.status !== 'open') return 'not-open';
    if (!isPaidInFull(table)) return 'unpaid';

    const { subtotal, serviceFeeAmount, total } = computeTotals(
      table.items,
      table.serviceFeeEnabled
    );
    const closedAt = new Date().toISOString();

    const sale: ClosedSale = {
      id: saleId,
      tableLabel: table.label,
      waiterName: table.waiterName,
      items: table.items,
      subtotal,
      serviceFeeAmount,
      total,
      payments: table.payments,
      openedAt: table.openedAt,
      closedAt,
      openedByUserId: table.openedByUserId,
      openedByUserName: table.openedByUserName,
      closedByUserId: closedBy.userId,
      closedByUserName: closedBy.userName,
    };

    tx.set(saleRef, sale);
    tx.update(tableRef, {
      status: 'closed',
      closedAt,
      subtotal,
      serviceFeeAmount,
      total,
      closedByUserId: closedBy.userId,
      closedByUserName: closedBy.userName,
    });
    return 'ok';
  });
}

interface DaySummaryRollup {
  date: string;
  totalRevenue: number;
  paymentBreakdown: Record<PaymentMethod, number>;
  closedAt: string;
}

// Zera o quadro do dia (apaga as mesas já fechadas) e grava o rollup usado
// pelos Relatórios. As vendas em si (`closedSales`) nunca são tocadas aqui —
// são o histórico permanente que sobrevive ao fim do dia.
export async function clearClosedTablesAndSummarize(
  orgId: string,
  rollup: DaySummaryRollup
): Promise<void> {
  const closedSnap = await getDocs(query(tablesCol(orgId), where('status', '==', 'closed')));
  const batch = writeBatch(db);
  closedSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.set(daySummaryDoc(orgId, rollup.date), rollup);
  await batch.commit();
}

export function subscribeOrgUsers(orgId: string, cb: (users: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(
    orgUsersCol(orgId),
    (snap) => cb(snap.docs.map((d) => d.data() as UserProfile)),
    logSnapshotError('orgUsers')
  );
}

export function setOrgUserActive(orgId: string, uid: string, active: boolean): Promise<void> {
  return updateDoc(doc(orgUsersCol(orgId), uid), { active });
}

export function subscribeAuditLog(
  orgId: string,
  pageSize: number,
  cb: (entries: AuditLogEntry[]) => void
): Unsubscribe {
  const q = query(auditLogCol(orgId), orderBy('timestamp', 'desc'), limit(pageSize));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry))),
    logSnapshotError('auditLog')
  );
}
