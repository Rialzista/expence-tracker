'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useSessionStore } from '../model/session-store';

/**
 * Токен персистится в localStorage и на первом клиентском рендере ещё не
 * восстановлен (zustand persist гидратируется асинхронно) — редирект нужно
 * откладывать до конца гидратации, иначе авторизованных пользователей будет
 * перекидывать на /login на каждой перезагрузке страницы. На SSR `window`
 * недоступен, поэтому `createJSONStorage` в zustand ловит исключение и
 * `useSessionStore.persist` там вообще не навешивается — отсюда опциональная
 * цепочка и фолбэк на `false`.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useSessionStore((state) => state.accessToken);
  const [hasHydrated, setHasHydrated] = useState(() => useSessionStore.persist?.hasHydrated() ?? false);

  useEffect(() => useSessionStore.persist?.onFinishHydration(() => setHasHydrated(true)), []);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace('/login');
    }
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated || !accessToken) {
    return null;
  }

  return children;
}
