import { useEffect, useState } from 'react';
import { subscribeClosedSalesRange } from '../services/firestoreOrg';
import { ClosedSale } from '../types';

function startOfDayIso(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayIso(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// Assina, em tempo real, as vendas fechadas de uma organização dentro do
// intervalo [start, end] (inclusive, por dia inteiro). Usado tanto pelos
// Relatórios quanto pelo histórico de mesas fechadas.
export function useClosedSalesRange(orgId: string | null, start: Date, end: Date) {
  const [sales, setSales] = useState<ClosedSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fromIso = startOfDayIso(start);
  const toIso = endOfDayIso(end);

  useEffect(() => {
    if (!orgId) {
      setSales([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeClosedSalesRange(orgId, fromIso, toIso, (data) => {
      setSales(data);
      setLoading(false);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, fromIso, toIso]);

  return { sales, loading };
}
