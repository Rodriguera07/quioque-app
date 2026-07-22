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

// Um pagamento individual recebido para a mesa. Sem split, uma única
// entrada cobre o total; com split, uma entrada por pessoa.
export interface SplitPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  paidAt: string; // ISO
}

export interface Table {
  id: string;
  label: string; // número ou nome da mesa
  waiterName?: string;
  status: TableStatus;
  items: OrderItem[];
  serviceFeeEnabled: boolean;
  splitEnabled: boolean;
  splitCount: number; // só relevante quando splitEnabled
  payments: SplitPayment[];
  openedAt: string; // ISO
  closedAt?: string; // ISO
  subtotal?: number;
  serviceFeeAmount?: number;
  total?: number;
  openedByUserId?: string;
  openedByUserName?: string;
  closedByUserId?: string;
  closedByUserName?: string;
}

export interface ClosedSale {
  id: string;
  tableLabel: string;
  waiterName?: string;
  items: OrderItem[];
  subtotal: number;
  serviceFeeAmount: number;
  total: number;
  payments: SplitPayment[];
  openedAt: string;
  closedAt: string;
  openedByUserId?: string;
  openedByUserName?: string;
  closedByUserId: string;
  closedByUserName: string;
}

export interface DaySummary {
  date: string; // yyyy-MM-dd
  totalRevenue: number;
  sales: ClosedSale[];
  closedAt: string;
  paymentBreakdown: Record<PaymentMethod, number>;
}

// --- Usuários, papéis e auditoria ---

export type Role = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  orgId: string;
  email: string;
  displayName: string;
  role: Role;
  active: boolean;
  createdAt: string; // ISO
  createdBy: string; // uid de quem criou
}

export type AuditEventType =
  | 'login'
  | 'logout'
  | 'table_opened'
  | 'items_added'
  | 'table_closed'
  | 'payment_recorded';

export interface AuditLogEntry {
  id: string;
  type: AuditEventType;
  userId: string;
  userName: string;
  timestamp: string; // ISO
  tableId?: string;
  tableLabel?: string;
  detail?: string;
}
