import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ClosedSale, DaySummary, MenuItem, OrderItem, PaymentMethod, Table } from '../types';
import { formatDateKey } from '../utils/format';
import { generateId } from '../utils/id';

const SERVICE_FEE_RATE = 0.1;

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
  closeTable: (tableId: string, paymentMethod: PaymentMethod) => void;
  endDay: () => DaySummary | null;
}

function computeTotals(items: OrderItem[], serviceFeeEnabled: boolean) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const serviceFeeAmount = serviceFeeEnabled ? subtotal * SERVICE_FEE_RATE : 0;
  const total = subtotal + serviceFeeAmount;
  return { subtotal, serviceFeeAmount, total };
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

      closeTable: (tableId, paymentMethod) => {
        const table = get().tables.find((t) => t.id === tableId);
        if (!table || table.items.length === 0) return;

        const { subtotal, serviceFeeAmount, total } = computeTotals(
          table.items,
          table.serviceFeeEnabled
        );
        const closedAt = new Date().toISOString();

        const closedSale: ClosedSale = {
          id: generateId('sale'),
          tableLabel: table.label,
          waiterName: table.waiterName,
          items: table.items,
          subtotal,
          serviceFeeAmount,
          total,
          paymentMethod,
          openedAt: table.openedAt,
          closedAt,
        };

        set((state) => ({
          closedSalesToday: [...state.closedSalesToday, closedSale],
          tables: state.tables.map((t) =>
            t.id === tableId
              ? { ...t, status: 'closed', closedAt, paymentMethod, subtotal, serviceFeeAmount, total }
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
          paymentBreakdown[sale.paymentMethod] += sale.total;
          totalRevenue += sale.total;
        });

        const summary: DaySummary = {
          date: currentDay,
          totalRevenue,
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

export { SERVICE_FEE_RATE };
