import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ClosedSale,
  DaySummary,
  MenuItem,
  OrderItem,
  PaymentMethod,
  SplitPayment,
  Table,
} from '../types';
import { formatDateKey } from '../utils/format';
import { generateId } from '../utils/id';

const SERVICE_FEE_RATE = 0.1;
const MIN_SPLIT_COUNT = 2;
const MAX_SPLIT_COUNT = 20;
const PAID_EPSILON = 0.004; // margem de segurança para comparação de centavos

interface PosState {
  tables: Table[];
  closedSalesToday: ClosedSale[];
  currentDay: string;
  history: DaySummary[];

  openTable: (label: string, waiterName?: string) => string;
  addItem: (tableId: string, menuItem: MenuItem, quantity?: number) => void;
  incrementItem: (tableId: string, orderItemId: string) => void;
  decrementItem: (tableId: string, orderItemId: string) => void;
  removeItem: (tableId: string, orderItemId: string) => void;
  toggleServiceFee: (tableId: string) => void;
  toggleSplit: (tableId: string) => void;
  setSplitCount: (tableId: string, count: number) => void;
  recordPayment: (tableId: string, method: PaymentMethod) => void;
  closeTable: (tableId: string) => void;
  endDay: () => DaySummary | null;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function computeTotals(items: OrderItem[], serviceFeeEnabled: boolean) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const serviceFeeAmount = serviceFeeEnabled ? round2(subtotal * SERVICE_FEE_RATE) : 0;
  const total = round2(subtotal + serviceFeeAmount);
  return { subtotal, serviceFeeAmount, total };
}

// Quanto será cobrado no PRÓXIMO pagamento registrado para a mesa. Sem
// split, é o valor restante inteiro (fecha em um único pagamento). Com
// split, é o valor por pessoa — exceto no último pagamento, que absorve
// o resto do arredondamento para que a soma bata exatamente com o total.
function computeNextPaymentAmount(table: Table): number {
  const { total } = computeTotals(table.items, table.serviceFeeEnabled);
  const paidTotal = round2(table.payments.reduce((sum, p) => sum + p.amount, 0));
  const remaining = Math.max(0, round2(total - paidTotal));

  if (!table.splitEnabled) return remaining;

  const unit = round2(total / table.splitCount);
  const isLastPerson = table.payments.length >= table.splitCount - 1;
  return isLastPerson ? remaining : Math.min(unit, remaining);
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      tables: [],
      closedSalesToday: [],
      currentDay: formatDateKey(),
      history: [],

      openTable: (label, waiterName) => {
        const id = generateId('table');
        const newTable: Table = {
          id,
          label: label.trim(),
          waiterName: waiterName?.trim() || undefined,
          status: 'open',
          items: [],
          serviceFeeEnabled: false,
          splitEnabled: false,
          splitCount: MIN_SPLIT_COUNT,
          payments: [],
          openedAt: new Date().toISOString(),
        };
        set((state) => ({ tables: [...state.tables, newTable] }));
        return id;
      },

      addItem: (tableId, menuItem, quantity = 1) => {
        set((state) => ({
          tables: state.tables.map((table) => {
            if (table.id !== tableId) return table;
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
            return { ...table, items };
          }),
        }));
      },

      incrementItem: (tableId, orderItemId) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id !== tableId
              ? table
              : {
                  ...table,
                  items: table.items.map((i) =>
                    i.id === orderItemId ? { ...i, quantity: i.quantity + 1 } : i
                  ),
                }
          ),
        }));
      },

      decrementItem: (tableId, orderItemId) => {
        set((state) => ({
          tables: state.tables.map((table) => {
            if (table.id !== tableId) return table;
            const items = table.items
              .map((i) => (i.id === orderItemId ? { ...i, quantity: i.quantity - 1 } : i))
              .filter((i) => i.quantity > 0);
            return { ...table, items };
          }),
        }));
      },

      removeItem: (tableId, orderItemId) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id !== tableId
              ? table
              : { ...table, items: table.items.filter((i) => i.id !== orderItemId) }
          ),
        }));
      },

      toggleServiceFee: (tableId) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id !== tableId
              ? table
              : { ...table, serviceFeeEnabled: !table.serviceFeeEnabled }
          ),
        }));
      },

      toggleSplit: (tableId) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id !== tableId || table.payments.length > 0
              ? table
              : { ...table, splitEnabled: !table.splitEnabled }
          ),
        }));
      },

      setSplitCount: (tableId, count) => {
        const clamped = Math.min(MAX_SPLIT_COUNT, Math.max(MIN_SPLIT_COUNT, Math.round(count)));
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id !== tableId || table.payments.length > 0
              ? table
              : { ...table, splitCount: clamped }
          ),
        }));
      },

      recordPayment: (tableId, method) => {
        const table = get().tables.find((t) => t.id === tableId);
        if (!table) return;
        const amount = computeNextPaymentAmount(table);
        if (amount <= 0) return;

        const payment: SplitPayment = {
          id: generateId('pay'),
          method,
          amount,
          paidAt: new Date().toISOString(),
        };

        set((state) => ({
          tables: state.tables.map((t) =>
            t.id !== tableId ? t : { ...t, payments: [...t.payments, payment] }
          ),
        }));
      },

      closeTable: (tableId) => {
        const table = get().tables.find((t) => t.id === tableId);
        if (!table || table.items.length === 0) return;

        const { subtotal, serviceFeeAmount, total } = computeTotals(
          table.items,
          table.serviceFeeEnabled
        );
        const paidTotal = round2(table.payments.reduce((sum, p) => sum + p.amount, 0));
        if (paidTotal + PAID_EPSILON < total) return; // ainda falta pagamento

        const closedAt = new Date().toISOString();

        const closedSale: ClosedSale = {
          id: generateId('sale'),
          tableLabel: table.label,
          waiterName: table.waiterName,
          items: table.items,
          subtotal,
          serviceFeeAmount,
          total,
          payments: table.payments,
          openedAt: table.openedAt,
          closedAt,
        };

        set((state) => ({
          closedSalesToday: [...state.closedSalesToday, closedSale],
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, status: 'closed', closedAt, subtotal, serviceFeeAmount, total }
              : t
          ),
        }));
      },

      endDay: () => {
        const { closedSalesToday, currentDay } = get();
        if (closedSalesToday.length === 0) {
          set({ tables: [], closedSalesToday: [], currentDay: formatDateKey() });
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

        const summary: DaySummary = {
          date: currentDay,
          totalRevenue: round2(totalRevenue),
          sales: closedSalesToday,
          closedAt: new Date().toISOString(),
          paymentBreakdown,
        };

        set((state) => ({
          history: [summary, ...state.history],
          tables: [],
          closedSalesToday: [],
          currentDay: formatDateKey(),
        }));

        return summary;
      },
    }),
    {
      name: 'quiosque-pos-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

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

export { MAX_SPLIT_COUNT, MIN_SPLIT_COUNT, SERVICE_FEE_RATE };
