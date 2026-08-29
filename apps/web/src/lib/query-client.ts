import { QueryClient } from '@tanstack/react-query';

/**
 * В App Router клиент создаётся заново на каждый запрос сервера,
 * поэтому фабрика, а не разделяемый экземпляр модуля.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Не перезапрашиваем сразу после гидратации серверных данных.
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
