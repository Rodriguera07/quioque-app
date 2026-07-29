import {
  collection,
  doc,
  getDoc,
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
import { AuditLogEntry, ClosedSale, MenuItemInput, PaymentMethod, Table, UserProfile } from '../types';
import { computeTotals, isPaidInFull } from '../utils/billing';

const tablesCol = (orgId: string) => collection(db, 'organizations', orgId, 'tables');
const closedSalesCol = (orgId: string) => collection(db, 'organizations', orgId, 'closedSales');
const orgUsersCol = (orgId: string) => collection(db, 'organizations', orgId, 'users');
const auditLogCol = (orgId: string) => collection(db, 'organizations', orgId, 'auditLog');
const daySummaryDoc = (orgId: string, date: string) =>
  doc(db, 'organizations', orgId, 'daySummaries', date);
const menuDoc = (orgId: string) => doc(db, 'organizations', orgId, 'config', 'menu');

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

// Rollup do dia anterior (gravado no encerramento de dia), usado só para
// comparar o faturamento de hoje com o de ontem no Painel. Se o dia anterior
// nunca foi encerrado (primeiro dia de uso, por exemplo), não existe rollup
// e a comparação simplesmente não aparece — não fabricamos um valor.
export async function getDaySummary(orgId: string, date: string): Promise<DaySummaryRollup | null> {
  const snap = await getDoc(daySummaryDoc(orgId, date));
  return snap.exists() ? (snap.data() as DaySummaryRollup) : null;
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

export function setUserPushToken(orgId: string, uid: string, expoPushToken: string): Promise<void> {
  return updateDoc(doc(orgUsersCol(orgId), uid), { expoPushToken });
}

// Tokens de todos os admins ativos da org. Inclui propositalmente quem
// disparou a ação: numa organização pequena o admin frequentemente também
// opera o caixa, e excluí-lo fazia a notificação nunca sair quando ele era o
// único admin cadastrado.
export async function getAdminPushTokens(orgId: string): Promise<string[]> {
  const q = query(orgUsersCol(orgId), where('role', '==', 'admin'), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .filter((u) => !!u.expoPushToken)
    .map((u) => u.expoPushToken as string);
}

// Quantos admins ativos a organização tem — usado para avisar um admin que
// está prestes a excluir a própria conta e ficaria sem ninguém para gerenciar
// usuários/relatórios depois.
export async function countActiveAdmins(orgId: string): Promise<number> {
  const q = query(orgUsersCol(orgId), where('role', '==', 'admin'), where('active', '==', true));
  const snap = await getDocs(q);
  return snap.size;
}

// Exclusão de conta pelo próprio usuário (LGPD, direito de eliminação):
// remove o perfil da organização e o ponteiro global uid -> org/role. O
// registro de vendas/mesas fechadas em que ele aparece como autor NÃO é
// apagado — é histórico financeiro do estabelecimento, mantido conforme a
// Política de Privacidade.
export function deleteOwnAccountData(orgId: string, uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(orgUsersCol(orgId), uid));
  batch.delete(doc(db, 'users', uid));
  return batch.commit();
}

// Cardápio: um único documento com a lista inteira, em vez de uma
// subcoleção por item — a tela de gestão edita tudo localmente e grava de
// uma vez só no "Salvar Cardápio", então não há motivo pra granularidade de
// um doc por item. `null` significa "organização ainda não salvou o próprio
// cardápio" (mostra o catálogo padrão local até o primeiro salvamento).
export function subscribeMenu(
  orgId: string,
  cb: (items: MenuItemInput[] | null) => void
): Unsubscribe {
  return onSnapshot(
    menuDoc(orgId),
    (snap) => cb(snap.exists() ? (snap.data().items as MenuItemInput[]) : null),
    logSnapshotError('menu')
  );
}

export function saveMenu(orgId: string, items: MenuItemInput[]): Promise<void> {
  return setDoc(menuDoc(orgId), { items, updatedAt: new Date().toISOString() });
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
