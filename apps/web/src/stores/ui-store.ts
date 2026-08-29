import { create } from 'zustand';

import type { TransactionType } from '@expense-tracker/shared';

/**
 * Zustand держит только состояние интерфейса. Всё, что приходит с сервера,
 * живёт в TanStack Query — дублировать серверные данные в сторе не нужно.
 */
interface UiState {
  sidebarOpen: boolean;
  transactionTypeFilter: TransactionType | 'ALL';
  toggleSidebar: () => void;
  setTransactionTypeFilter: (filter: TransactionType | 'ALL') => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  transactionTypeFilter: 'ALL',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTransactionTypeFilter: (transactionTypeFilter) => set({ transactionTypeFilter }),
}));
