import { create } from 'zustand';
import {
  clearClosedTablesAndSummarize,
  closeTableTransaction,
  newTableId,
  subscribeClosedSalesSince,
  subscribeTables,
  updateTable,
  setTable,
  type CloseTableResult,
} from '../services/firestoreOrg';
import { logAuditEvent } from '../services/auditLog';
import { ClosedSale, DaySummary, MenuItem, OrderItem, PaymentMethod, SplitPayment, Table } from '../types';
import {
  MAX_SPLIT_COUNT,
  MIN_SPLIT_COUNT,
  PAID_EPSILON,
  computeNextPaymentAmount,
  computeTotals,
  round2,
} from '../utils/billing';
import { formatDateKey } from '../utils/format';
import { generateId } from '../utils/id';
import type { Unsubscribe } from 'firebase/firestore';

interface CurrentUser {
  uid: string;
  displayName: string;
}

interface PosState {
  tables: Table[];
  closedSalesToday: ClosedSale[];
  currentDay: string;
  orgId: string | null;
  currentUser: CurrentUser | null;

  initOrgSync: (orgId: string, user: CurrentUser) => void;
  teardownOrgSync: () => void;

  openTable: (label: string, waiterName?: string) => string;
  addItem: (tableId: string, menuItem: MenuItem, quantity?: number) => void;
  incrementItem: (tableId: string, orderItemId: string) => void;
  decrementItem: (tableId: string, orderItemId: string) => void;
  removeItem: (tableId: string, orderItemId: string) => void;
  toggleServiceFee: (tableId: string) => void;
  toggleSplit: (tableId: string) => void;
  setSplitCount: (tableId: string, count: number) => void;
  recordPayment: (tableId: string, method: PaymentMethod) => Promise<void>;
  closeTable: (tableId: string) => Promise<CloseTableResult>;
  endDay: () => Promise<DaySummary | null>;
}

let tablesUnsubscribe: Unsubscribe | null = null;
let closedSalesUnsubscribe: Unsubscribe | null = null;

export const usePosStore = create<PosState>((set, get) => ({
  tables: [],
  closedSalesToday: [],
  currentDay: formatDateKey(),
  orgId: null,
  currentUser: null,

  initOrgSync: (orgId, user) => {
    tablesUnsubscribe?.();
    closedSalesUnsubscribe?.();

    set({ orgId, currentUser: user, currentDay: formatDateKey() });

    tablesUnsubscribe = subscribeTables(orgId, (tables) => set({ tables }));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    closedSalesUnsubscribe = subscribeClosedSalesSince(
      orgId,
      startOfToday.toISOString(),
      (closedSalesToday) => set({ closedSalesToday })
    );
  },

  teardownOrgSync: () => {
    tablesUnsubscribe?.();
    closedSalesUnsubscribe?.();
    tablesUnsubscribe = null;
    closedSalesUnsubscribe = null;
    set({ tables: [], closedSalesToday: [], orgId: null, currentUser: null });
  },

  openTable: (label, waiterName) => {
    const { orgId, currentUser } = get();
    if (!orgId || !currentUser) return '';

    const id = newTableId(orgId);
    const trimmedLabel = label.trim();
    const newTable: Table = {
      id,
      label: trimmedLabel,
      waiterName: waiterName?.trim() || undefined,
      status: 'open',
      items: [],
      serviceFeeEnabled: false,
      splitEnabled: false,
      splitCount: MIN_SPLIT_COUNT,
      payments: [],
      openedAt: new Date().toISOString(),
      openedByUserId: currentUser.uid,
      openedByUserName: currentUser.displayName,
    };

    setTable(orgId, newTable).catch((err) => console.warn('Falha ao abrir mesa', err));
    logAuditEvent({
      orgId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      type: 'table_opened',
      tableId: id,
      tableLabel: trimmedLabel,
    });

    return id;
  },

  addItem: (tableId, menuItem, quantity = 1) => {
    const { orgId, currentUser, tables } = get();
    if (!orgId || !currentUser) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const existing = table.items.find((i) => i.menuItemId === menuItem.id);
    let items: OrderItem[];
    if (existing) {
      items = table.items.map((i) =>
        i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      items = [
        ...table.items,
        {
          id: generateId('item'),
          menuItemId: menuItem.id,
          name: menuItem.name,
          category: menuItem.category,
          unitPrice: menuItem.price,
          quantity,
        },
      ];
    }

    updateTable(orgId, tableId, { items }).catch((err) =>
      console.warn('Falha ao adicionar item', err)
    );
    logAuditEvent({
      orgId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      type: 'items_added',
      tableId,
      tableLabel: table.label,
      detail: `${quantity}x ${menuItem.name}`,
    });
  },

  incrementItem: (tableId, orderItemId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const items = table.items.map((i) =>
      i.id === orderItemId ? { ...i, quantity: i.quantity + 1 } : i
    );
    updateTable(orgId, tableId, { items }).catch((err) =>
      console.warn('Falha ao atualizar item', err)
    );
  },

  decrementItem: (tableId, orderItemId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const items = table.items
      .map((i) => (i.id === orderItemId ? { ...i, quantity: i.quantity - 1 } : i))
      .filter((i) => i.quantity > 0);
    updateTable(orgId, tableId, { items }).catch((err) =>
      console.warn('Falha ao atualizar item', err)
    );
  },

  removeItem: (tableId, orderItemId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const items = table.items.filter((i) => i.id !== orderItemId);
    updateTable(orgId, tableId, { items }).catch((err) =>
      console.warn('Falha ao remover item', err)
    );
  },

  toggleServiceFee: (tableId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    updateTable(orgId, tableId, { serviceFeeEnabled: !table.serviceFeeEnabled }).catch((err) =>
      console.warn('Falha ao atualizar taxa de serviço', err)
    );
  },

  toggleSplit: (tableId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.payments.length > 0) return;
    updateTable(orgId, tableId, { splitEnabled: !table.splitEnabled }).catch((err) =>
      console.warn('Falha ao atualizar divisão de conta', err)
    );
  },

  setSplitCount: (tableId, count) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.payments.length > 0) return;
    const clamped = Math.min(MAX_SPLIT_COUNT, Math.max(MIN_SPLIT_COUNT, Math.round(count)));
    updateTable(orgId, tableId, { splitCount: clamped }).catch((err) =>
      console.warn('Falha ao atualizar divisão de conta', err)
    );
  },

  recordPayment: async (tableId, method) => {
    const { orgId, currentUser, tables } = get();
    if (!orgId || !currentUser) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const amount = computeNextPaymentAmount(table);
    if (amount <= 0) return;

    const payment: SplitPayment = {
      id: generateId('pay'),
      method,
      amount,
      paidAt: new Date().toISOString(),
    };

    // Aguardado (não fire-and-forget) porque a tela de fechamento de mesa
    // depende de o pagamento já estar confirmado no servidor antes de
    // chamar closeTable — a transação de fechamento revalida o saldo lendo
    // o documento direto do servidor.
    await updateTable(orgId, tableId, { payments: [...table.payments, payment] });
    logAuditEvent({
      orgId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      type: 'payment_recorded',
      tableId,
      tableLabel: table.label,
      detail: `${PAYMENT_METHOD_LABEL[method]} · ${amount.toFixed(2)}`,
    });
  },

  closeTable: async (tableId) => {
    const { orgId, currentUser, tables } = get();
    if (!orgId || !currentUser) return 'not-found';
    const table = tables.find((t) => t.id === tableId);
    if (!table) return 'not-found';

    const saleId = generateId('sale');
    const result = await closeTableTransaction(orgId, tableId, saleId, {
      userId: currentUser.uid,
      userName: currentUser.displayName,
    });

    if (result === 'ok') {
      logAuditEvent({
        orgId,
        userId: currentUser.uid,
        userName: currentUser.displayName,
        type: 'table_closed',
        tableId,
        tableLabel: table.label,
      });
    }

    return result;
  },

  endDay: async () => {
    const { orgId, currentUser, closedSalesToday, currentDay } = get();
    if (!orgId || !currentUser) return null;
    if (closedSalesToday.length === 0) {
      set({ currentDay: formatDateKey() });
      return null;
    }

    const paymentBreakdown: Record<PaymentMethod, number> = {
      pix: 0,
      dinheiro: 0,
      debito: 0,
      credito: 0,
    };
    let totalRevenue = 0;
    closedSalesToday.forEach((sale) => {
      sale.payments.forEach((payment) => {
        paymentBreakdown[payment.method] = round2(
          paymentBreakdown[payment.method] + payment.amount
        );
      });
      totalRevenue += sale.total;
    });

    const closedAt = new Date().toISOString();
    const summary: DaySummary = {
      date: currentDay,
      totalRevenue: round2(totalRevenue),
      sales: closedSalesToday,
      closedAt,
      paymentBreakdown,
    };

    await clearClosedTablesAndSummarize(orgId, {
      date: currentDay,
      totalRevenue: summary.totalRevenue,
      paymentBreakdown,
      closedAt,
    });

    // Reinicia a janela de "vendas de hoje" a partir de agora — sem isso, o
    // Dashboard (faturamento, ticket médio, mais vendidos) continuaria
    // somando as vendas do turno recém-encerrado com as do próximo turno
    // sempre que ambos caírem no mesmo dia civil.
    closedSalesUnsubscribe?.();
    closedSalesUnsubscribe = subscribeClosedSalesSince(orgId, closedAt, (closedSalesToday) =>
      set({ closedSalesToday })
    );

    set({ currentDay: formatDateKey(), closedSalesToday: [] });

    return summary;
  },
}));

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
};

// --- Selectors / helpers ---

export function getOpenTables(tables: Table[]): Table[] {
  return tables.filter((t) => t.status === 'open');
}

export function getClosedTablesToday(tables: Table[]): Table[] {
  return tables.filter((t) => t.status === 'closed');
}

export function getTableCurrentTotal(table: Table): number {
  return computeTotals(table.items, table.serviceFeeEnabled).total;
}

export function getTodayRevenue(closedSalesToday: ClosedSale[]): number {
  return closedSalesToday.reduce((sum, sale) => sum + sale.total, 0);
}

export function getPaidTotal(table: Table): number {
  return round2(table.payments.reduce((sum, p) => sum + p.amount, 0));
}

export function getRemainingAmount(table: Table): number {
  const { total } = computeTotals(table.items, table.serviceFeeEnabled);
  return Math.max(0, round2(total - getPaidTotal(table)));
}

// Valor por pessoa "teórico" (total / splitCount), usado para exibição no
// card de resumo. Arredondado para 2 casas decimais.
export function getSplitUnitAmount(table: Table): number {
  const { total } = computeTotals(table.items, table.serviceFeeEnabled);
  return round2(total / table.splitCount);
}

export function getPaidPeopleCount(table: Table): number {
  return table.payments.length;
}

export function isTableFullyPaid(table: Table): boolean {
  return getRemainingAmount(table) <= PAID_EPSILON;
}

export function getNextPaymentAmount(table: Table): number {
  return computeNextPaymentAmount(table);
}

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  quantity: number;
}

export function getTopSellingItems(
  tables: Table[],
  closedSalesToday: ClosedSale[],
  limit = 5
): TopSellingItem[] {
  const counts = new Map<string, TopSellingItem>();

  // Closed tables' items are already represented in closedSalesToday, so
  // only open tables are included here to avoid double-counting.
  const allItems: OrderItem[] = [
    ...getOpenTables(tables).flatMap((t) => t.items),
    ...closedSalesToday.flatMap((s) => s.items),
  ];

  allItems.forEach((item) => {
    const existing = counts.get(item.menuItemId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      counts.set(item.menuItemId, {
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
      });
    }
  });

  return Array.from(counts.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export { MAX_SPLIT_COUNT, MIN_SPLIT_COUNT, PAID_EPSILON, SERVICE_FEE_RATE } from '../utils/billing';
