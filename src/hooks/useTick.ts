import { useEffect, useState } from 'react';

// Força um re-render periódico para telas com valores derivados do relógio
// (ex.: tempo decorrido de uma mesa), que de outra forma ficariam parados
// entre re-renders disparados pela store.
export function useTick(intervalMs = 30000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
