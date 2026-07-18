import { ClosedSale, DaySummary, PaymentMethod } from '../types';

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  quantity: number;
}

export interface PeriodReport {
  totalRevenue: number;
  salesCount: number;
  topItems: TopSellingItem[];
  paymentBreakdown: Record<PaymentMethod, number>;
}

export function getAllSales(history: DaySummary[], closedSalesToday: ClosedSale[]): ClosedSale[] {
  return [...history.flatMap((h) => h.sales), ...closedSalesToday];
}

export function getPeriodReport(sales: ClosedSale[], startDate: Date, endDate: Date): PeriodReport {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const filtered = sales.filter((sale) => {
    const closedAt = new Date(sale.closedAt).getTime();
    return closedAt >= start.getTime() && closedAt <= end.getTime();
  });

  const paymentBreakdown: Record<PaymentMethod, number> = {
    pix: 0,
    dinheiro: 0,
    debito: 0,
    credito: 0,
  };

  const itemCounts = new Map<string, TopSellingItem>();
  let totalRevenue = 0;

  filtered.forEach((sale) => {
    totalRevenue += sale.total;
    paymentBreakdown[sale.paymentMethod] += sale.total;
    sale.items.forEach((item) => {
      const existing = itemCounts.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemCounts.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
        });
      }
    });
  });

  const topItems = Array.from(itemCounts.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return { totalRevenue, salesCount: filtered.length, topItems, paymentBreakdown };
}
