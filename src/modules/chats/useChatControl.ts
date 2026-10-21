"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getControlAction } from "./control-actions";
import { resolverControl, type EstadoControl } from "./control-types";

export function useChatControl(id: string) {
  const cache = useQueryClient();
  return useQuery({
    queryKey: queryKeys.whatsappControl(id),
    queryFn: async () => {
      const actual = resolverControl(await getControlAction(id));
      const previo = cache.getQueryData<EstadoControl>(
        queryKeys.whatsappControl(id),
      );
      return previo && previo.controlVersion > actual.controlVersion
        ? previo
        : actual;
    },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: "always",
    refetchInterval: (q) =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? q.state.data?.modoAtencion === "TOMANDO_CONTROL"
          ? 1500
          : 15000
        : false,
  });
}
