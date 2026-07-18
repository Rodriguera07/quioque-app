export type MenuCategory = 'bebidas' | 'drinks' | 'doses' | 'porcoes' | 'pasteis';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description?: string;
}

export interface OrderItem {
  id: string; // id único da linha no pedido
  menuItemId: string;
  name: string;
  category: MenuCategory;
  unitPrice: number;
  quantity: number;
}

export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito';

export type TableStatus = 'open' | 'closed';

export interface Table {
  id: string;
  label: string; // número ou nome da mesa
  waiterName?: string;
  status: TableStatus;
  items: OrderItem[];
  serviceFeeEnabled: boolean;
  openedAt: string; // ISO
  closedAt?: string; // ISO
  paymentMethod?: PaymentMethod;
  subtotal?: number;
  serviceFeeAmount?: number;
  total?: number;
}

export interface ClosedSale {
  id: string;
  tableLabel: string;
  waiterName?: string;
  items: OrderItem[];
  subtotal: number;
  serviceFeeAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  openedAt: string;
  closedAt: string;
}

export interface DaySummary {
  date: string; // yyyy-MM-dd
  totalRevenue: number;
  sales: ClosedSale[];
  closedAt: string;
  paymentBreakdown: Record<PaymentMethod, number>;
}
