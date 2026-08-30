'use client';

import { useRouter } from 'next/navigation';

import { useSessionStore } from '@/entities/session';

export function useLogout() {
  const router = useRouter();
  const clearSession = useSessionStore((state) => state.clearSession);

  return () => {
    clearSession();
    router.push('/login');
  };
}
