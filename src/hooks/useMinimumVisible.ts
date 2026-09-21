import { useEffect, useRef, useState } from 'react';

// Duração mínima (ms) que a tela de loading da marca fica visível — tanto na
// abertura do app quanto após o login — pra dar tempo do usuário perceber a
// animação em vez de um piscar rápido em conexões/dispositivos mais rápidos.
export const LOADING_MIN_DURATION_MS = 1800;

// `active` pode virar `true`/`false` várias vezes (ex.: login, tenta de
// novo após erro) — cada vez que liga, reinicia a contagem mínima antes de
// permitir desligar de novo.
export function useMinimumVisible(active: boolean, minMs: number = LOADING_MIN_DURATION_MS): boolean {
  const [sustained, setSustained] = useState(active);
  const activatedAt = useRef<number | null>(active ? Date.now() : null);

  useEffect(() => {
    if (active) {
      activatedAt.current = Date.now();
      setSustained(true);
      return;
    }
    const elapsed = activatedAt.current ? Date.now() - activatedAt.current : minMs;
    const remaining = Math.max(0, minMs - elapsed);
    const timer = setTimeout(() => setSustained(false), remaining);
    return () => clearTimeout(timer);
  }, [active, minMs]);

  return sustained;
}
