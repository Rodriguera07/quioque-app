import { OrderItem, Table } from '../types';

export const SERVICE_FEE_RATE = 0.1;
export const MIN_SPLIT_COUNT = 2;
export const MAX_SPLIT_COUNT = 20;
export const PAID_EPSILON = 0.004; // margem de segurança para comparação de centavos

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeTotals(items: OrderItem[], serviceFeeEnabled: boolean) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const serviceFeeAmount = serviceFeeEnabled ? round2(subtotal * SERVICE_FEE_RATE) : 0;
  const total = round2(subtotal + serviceFeeAmount);
  return { subtotal, serviceFeeAmount, total };
}

// Quanto será cobrado no PRÓXIMO pagamento registrado para a mesa. Sem
// split, é o valor restante inteiro (fecha em um único pagamento). Com
// split, é o valor por pessoa — exceto no último pagamento, que absorve
// o resto do arredondamento para que a soma bata exatamente com o total.
export function computeNextPaymentAmount(table: Table): number {
  const { total } = computeTotals(table.items, table.serviceFeeEnabled);
  const paidTotal = round2(table.payments.reduce((sum, p) => sum + p.amount, 0));
  const remaining = Math.max(0, round2(total - paidTotal));

  if (!table.splitEnabled) return remaining;

  const unit = round2(total / table.splitCount);
  const isLastPerson = table.payments.length >= table.splitCount - 1;
  return isLastPerson ? remaining : Math.min(unit, remaining);
}

export function isPaidInFull(table: Table): boolean {
  const { total } = computeTotals(table.items, table.serviceFeeEnabled);
  const paidTotal = round2(table.payments.reduce((sum, p) => sum + p.amount, 0));
  return paidTotal + PAID_EPSILON >= total;
}
