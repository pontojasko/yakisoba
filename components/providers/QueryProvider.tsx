"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados considerados frescos por 30s — sem refetch desnecessário
            staleTime: 30 * 1000,
            // Mantém no cache por 5min após componente desmontar
            gcTime: 5 * 60 * 1000,
            // Não refetch ao focar janela nas páginas admin (desnecessário)
            refetchOnWindowFocus: false,
            // Retry apenas 1x em erros
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
