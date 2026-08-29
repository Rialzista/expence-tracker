import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthResponse, UserResponse } from '@expense-tracker/shared';

interface SessionState {
  accessToken: string | null;
  user: UserResponse | null;
  setSession: (data: AuthResponse) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
    }),
    { name: 'auth-session' },
  ),
);
