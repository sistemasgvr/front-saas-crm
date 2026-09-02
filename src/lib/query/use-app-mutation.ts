"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseAppMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage?: string;
  invalidateKeys?: QueryKey[];
  redirectTo?: string;
  refresh?: boolean;
  /** true = no dispara el overlay global de "Procesando…" (ver
   * ActionLoader). Para acciones chiquitas e instantáneas (reaccionar a un
   * mensaje, tildar un checkbox) donde tapar toda la pantalla se siente
   * exagerado — el propio componente que llama se encarga de mostrar su
   * loading local (un spinner en el botón, por ejemplo). */
  silent?: boolean;
}

export function useAppMutation<TData, TVariables = void>(options: UseAppMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: options.mutationFn,
    meta: { silent: options.silent ?? false },
    onSuccess: async () => {
      if (options.successMessage) toast.success(options.successMessage);
      if (options.invalidateKeys?.length) {
        await Promise.all(options.invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      }
      if (options.redirectTo) router.push(options.redirectTo);
      if (options.refresh) router.refresh();
    },
  });
}
