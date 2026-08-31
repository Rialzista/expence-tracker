export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params: { page: number; limit: number }) =>
    [...transactionKeys.all, 'list', params] as const,
  summary: (params: { month: number; year: number }) =>
    [...transactionKeys.all, 'summary', params] as const,
};
