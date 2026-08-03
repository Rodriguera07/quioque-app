import { create } from 'zustand';
import { DEFAULT_IMAGE_BY_ID, DEFAULT_MENU_ITEMS, normalizePortionItems, sortMenuItems } from '../data/menu';
import {
  clearClosedTablesAndSummarize,
  closeTableTransaction,
  getClosedSalesSince,
  getDaySummary,
  newTableId,
  saveMenu,
  subscribeClosedSalesSince,
  subscribeMenu,
  subscribeTables,
  updateTable,
  setTable,
  type CloseTableResult,
} from '../services/firestoreOrg';
import { logAuditEvent } from '../services/auditLog';
import { notifyAdmins } from '../services/notifications';
import {
  ClosedSale,
  DaySummary,
  MenuItem,
  MenuItemInput,
  OrderItem,
  PaymentMethod,
  SplitPayment,
  Table,
} from '../types';
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
import { showAlert } from '../utils/alert';
import type { Unsubscribe } from 'firebase/firestore';

// Escritas "dispare e esqueça" (não aguardadas pela UI) falhavam em
// silêncio — o usuário via a mudança sumir sem explicação quando o listener
// do Firestore revertia o valor otimista. Isso garante um aviso mínimo.
function warnAndAlert(context: string, title: string) {
  return (err: unknown) => {
    console.warn(`[usePosStore] ${context}`, err);
    showAlert(title, 'Verifique sua conexão e tente novamente.');
  };
}

interface CurrentUser {
  uid: string;
  displayName: string;
}

interface PosState {
  tables: Table[];
  closedSalesToday: ClosedSale[];
  // Início (ISO) da janela de "vendas de hoje" atualmente assinada — usado
  // pelo endDay para reler o Firestore direto do servidor nesse mesmo
  // recorte, em vez de confiar só na foto local do listener.
  salesWindowStart: string | null;
  menuItems: MenuItem[];
  currentDay: string;
  orgId: string | null;
  currentUser: CurrentUser | null;

  initOrgSync: (orgId: string, user: CurrentUser) => void;
  teardownOrgSync: () => void;
  saveMenuItems: (items: MenuItemInput[]) => Promise<boolean>;

  openTable: (label: string, waiterName?: string) => string;
  renameTable: (tableId: string, label: string) => void;
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

// Enche `image` (require() de asset local) a partir do catálogo padrão, por
// id — itens do Firestore nunca carregam imagem própria (ver MenuItemInput).
function hydrateMenu(items: MenuItemInput[]): MenuItem[] {
  return sortMenuItems(
    normalizePortionItems(items).map((item) => ({ ...item, image: DEFAULT_IMAGE_BY_ID[item.id] }))
  );
}

// Aplica os itens localmente antes de disparar a escrita no Firestore (que
// só volta pelo listener de `subscribeTables` depois de um round-trip). Sem
// isso, dois toques rápidos no +/- de um item (garçom apressado) leem o
// mesmo `tables` desatualizado e cada um escreve "quantidade + 1" a partir do
// mesmo valor antigo — um dos incrementos some silenciosamente.
function withItems(tables: Table[], tableId: string, items: OrderItem[]): Table[] {
  return tables.map((t) => (t.id === tableId ? { ...t, items } : t));
}

let tablesUnsubscribe: Unsubscribe | null = null;
let closedSalesUnsubscribe: Unsubscribe | null = null;
let menuUnsubscribe: Unsubscribe | null = null;

export const usePosStore = create<PosState>((set, get) => ({
  tables: [],
  closedSalesToday: [],
  salesWindowStart: null,
  menuItems: DEFAULT_MENU_ITEMS,
  currentDay: formatDateKey(),
  orgId: null,
  currentUser: null,

  initOrgSync: (orgId, user) => {
    tablesUnsubscribe?.();
    closedSalesUnsubscribe?.();
    menuUnsubscribe?.();

    set({ orgId, currentUser: user, currentDay: formatDateKey() });

    tablesUnsubscribe = subscribeTables(orgId, (tables) => set({ tables }));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Se o dia já foi encerrado antes nesta mesma data (em qualquer sessão
    // ou dispositivo), o corte de "vendas de hoje" precisa começar depois
    // desse fechamento, não da meia-noite — senão, ao sair e entrar de novo
    // no mesmo dia, as vendas já encerradas voltam a aparecer como se o dia
    // nunca tivesse sido fechado.
    getDaySummary(orgId, formatDateKey()).then((rollup) => {
      // A org pode ter trocado (novo login) enquanto essa leitura estava em
      // andamento — nesse caso, quem já reiniciou a sincronização por último
      // é quem deve vencer.
      if (get().orgId !== orgId) return;
      const since =
        rollup && rollup.closedAt > startOfToday.toISOString()
          ? rollup.closedAt
          : startOfToday.toISOString();
      set({ salesWindowStart: since });
      closedSalesUnsubscribe = subscribeClosedSalesSince(orgId, since, (closedSalesToday) =>
        set({ closedSalesToday })
      );
    });

    menuUnsubscribe = subscribeMenu(orgId, (items) => {
      set({ menuItems: items ? hydrateMenu(items) : DEFAULT_MENU_ITEMS });
    });
  },

  teardownOrgSync: () => {
    tablesUnsubscribe?.();
    closedSalesUnsubscribe?.();
    menuUnsubscribe?.();
    tablesUnsubscribe = null;
    closedSalesUnsubscribe = null;
    menuUnsubscribe = null;
    set({
      tables: [],
      closedSalesToday: [],
      salesWindowStart: null,
      menuItems: DEFAULT_MENU_ITEMS,
      orgId: null,
      currentUser: null,
    });
  },

  saveMenuItems: async (items) => {
    const { orgId, currentUser } = get();
    if (!orgId) return false;
    try {
      await saveMenu(orgId, items);
      if (currentUser) {
        logAuditEvent({
          orgId,
          userId: currentUser.uid,
          userName: currentUser.displayName,
          type: 'menu_updated',
        });
      }
      return true;
    } catch (err) {
      console.warn('[usePosStore] salvar cardápio', err);
      return false;
    }
  },

  openTable: (label, waiterName) => {
    const { orgId, currentUser, tables } = get();
    if (!orgId || !currentUser) return '';

    const trimmedLabel = label.trim();
    // A tela já bloqueia e avisa o usuário antes de chegar aqui — este é só
    // um guard silencioso contra chamadas concorrentes (ex.: duplo toque no
    // botão "Abrir Mesa" antes do primeiro clique navegar para longe da tela).
    const duplicate = tables.some(
      (t) => t.status === 'open' && t.label.trim().toLowerCase() === trimmedLabel.toLowerCase()
    );
    if (duplicate) return '';

    const id = newTableId(orgId);
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

    setTable(orgId, newTable).catch(warnAndAlert('abrir mesa', 'Não foi possível abrir a mesa'));
    logAuditEvent({
      orgId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      type: 'table_opened',
      tableId: id,
      tableLabel: trimmedLabel,
    });
    notifyAdmins(orgId, 'Mesa aberta', `${currentUser.displayName} abriu a mesa ${trimmedLabel}.`);

    return id;
  },

  renameTable: (tableId, label) => {
    const { orgId, currentUser, tables } = get();
    if (!orgId || !currentUser) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.status !== 'open') return;
    const trimmed = label.trim();
    if (!trimmed || trimmed === table.label) return;

    updateTable(orgId, tableId, { label: trimmed }).catch(
      warnAndAlert('renomear mesa', 'Não foi possível renomear a mesa')
    );
    logAuditEvent({
      orgId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      type: 'table_renamed',
      tableId,
      tableLabel: trimmed,
      detail: `De "${table.label}" para "${trimmed}"`,
    });
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

    set({ tables: withItems(tables, tableId, items) });
    updateTable(orgId, tableId, { items }).catch(
      warnAndAlert('adicionar item', 'Não foi possível adicionar o item')
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
    notifyAdmins(
      orgId,
      'Itens adicionados',
      `${currentUser.displayName} adicionou ${quantity}x ${menuItem.name} na mesa ${table.label}.`
    );
  },

  incrementItem: (tableId, orderItemId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const items = table.items.map((i) =>
      i.id === orderItemId ? { ...i, quantity: i.quantity + 1 } : i
    );
    set({ tables: withItems(tables, tableId, items) });
    updateTable(orgId, tableId, { items }).catch(
      warnAndAlert('incrementar item', 'Não foi possível atualizar o item')
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
    set({ tables: withItems(tables, tableId, items) });
    updateTable(orgId, tableId, { items }).catch(
      warnAndAlert('decrementar item', 'Não foi possível atualizar o item')
    );
  },

  removeItem: (tableId, orderItemId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const items = table.items.filter((i) => i.id !== orderItemId);
    set({ tables: withItems(tables, tableId, items) });
    updateTable(orgId, tableId, { items }).catch(
      warnAndAlert('remover item', 'Não foi possível remover o item')
    );
  },

  toggleServiceFee: (tableId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    updateTable(orgId, tableId, { serviceFeeEnabled: !table.serviceFeeEnabled }).catch(
      warnAndAlert('atualizar taxa de serviço', 'Não foi possível atualizar a taxa de serviço')
    );
  },

  toggleSplit: (tableId) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.payments.length > 0) return;
    updateTable(orgId, tableId, { splitEnabled: !table.splitEnabled }).catch(
      warnAndAlert('atualizar divisão de conta', 'Não foi possível atualizar a divisão da conta')
    );
  },

  setSplitCount: (tableId, count) => {
    const { orgId, tables } = get();
    if (!orgId) return;
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.payments.length > 0) return;
    const clamped = Math.min(MAX_SPLIT_COUNT, Math.max(MIN_SPLIT_COUNT, Math.round(count)));
    updateTable(orgId, tableId, { splitCount: clamped }).catch(
      warnAndAlert('atualizar divisão de conta', 'Não foi possível atualizar a divisão da conta')
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
    notifyAdmins(
      orgId,
      'Pagamento registrado',
      `${currentUser.displayName} registrou ${PAYMENT_METHOD_LABEL[method]} (R$ ${amount.toFixed(2)}) na mesa ${table.label}.`
    );
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
      notifyAdmins(orgId, 'Mesa fechada', `${currentUser.displayName} fechou a mesa ${table.label}.`);
    }

    return result;
  },

  endDay: async () => {
    const { orgId, currentUser, salesWindowStart, currentDay } = get();
    if (!orgId || !currentUser) return null;

    // Lido direto do servidor (não da foto local de `closedSalesToday`): o
    // listener local pode estar alguns instantes atrasado, especialmente
    // quando o fechamento de uma mesa e o encerramento do dia acontecem em
    // dispositivos diferentes — nesse caso, encerrar com base no listener
    // deixaria essa venda de fora do rollup do dia para sempre (a próxima
    // janela começa depois deste corte).
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const since = salesWindowStart ?? startOfToday.toISOString();
    const sales = await getClosedSalesSince(orgId, since);

    if (sales.length === 0) {
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
    sales.forEach((sale) => {
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
      sales,
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

    set({ currentDay: formatDateKey(), closedSalesToday: [], salesWindowStart: closedAt });

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
