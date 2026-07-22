import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { PaymentMethod, SplitPayment } from '../types';

export const PAYMENT_LABELS: Record<
  PaymentMethod,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  pix: { label: 'PIX', icon: 'qr-code-outline', color: colors.pix },
  dinheiro: { label: 'Dinheiro', icon: 'cash-outline', color: colors.cash },
  debito: { label: 'Débito', icon: 'card-outline', color: colors.debit },
  credito: { label: 'Crédito', icon: 'card', color: colors.credit },
};

export function describeSalePayments(payments: SplitPayment[]): string {
  const uniqueMethods = Array.from(new Set(payments.map((p) => p.method)));
  if (payments.length <= 1) {
    return uniqueMethods.length > 0 ? PAYMENT_LABELS[uniqueMethods[0]].label : '—';
  }
  return `Dividido · ${payments.length} pessoas`;
}
