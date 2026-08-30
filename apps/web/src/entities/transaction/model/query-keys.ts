export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params: { page: number; limit: number }) =>
    [...transactionKeys.all, 'list', params] as const,
};
