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
}

export function useAppMutation<TData, TVariables = void>(options: UseAppMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: options.mutationFn,
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
