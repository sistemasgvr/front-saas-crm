"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { getMetaPipeline } from "./queries";

/** Comparte una consulta por tipo entre lista, detalle e historial. */
export function usePipelineMeta(tipoLead: string | null | undefined) {
  const tipo = tipoLead ?? "OTRO";
  return useQuery({
    queryKey: queryKeys.leadPipelineMeta(tipo),
    queryFn: () => getMetaPipeline(tipo),
  });
}
