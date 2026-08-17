"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ActionLoader } from "@/src/components/ui/ActionLoader";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
        // Las queries llaman Server Actions mismo-origen (RPC vía RSC), no
        // requests de red externas — el online-detection del navegador no
        // aplica y puede dejar queries "paused" indefinidamente si se
        // dispara un evento offline espurio (visto en HMR/dev tools).
        networkMode: 'always',
      },
      mutations: {
        retry: 0,
        networkMode: 'always',
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "No se pudo completar la acción");
      },
    }),
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ActionLoader />
    </QueryClientProvider>
  );
}
