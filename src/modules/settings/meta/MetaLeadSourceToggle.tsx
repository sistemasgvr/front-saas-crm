"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMetaLeadSources } from "./queries";
import { setMetaLeadSourceAction } from "./actions";
import { unwrapServerAction } from "@/src/lib/action-result";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";

const key = ["meta", "lead-sources"] as const;
const guardar = unwrapServerAction(setMetaLeadSourceAction);

export default function MetaLeadSourceToggle({ tipo, id, nombre, paginaId }: {
  tipo: "paginas" | "campanas" | "formularios";
  id: string;
  nombre: string;
  paginaId?: string;
}) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: key, queryFn: getMetaLeadSources, staleTime: 30_000 });
  const origen = query.data?.[tipo].find((item) => item.id === id);
  const habilitado = origen?.importarLeadsAutomaticamente ?? false;
  const paginaDesactivada = paginaId && query.data?.paginas.find((p) => p.id === paginaId)?.importarLeadsAutomaticamente === false;
  const mutation = useAppMutation({
    mutationFn: async () => {
      await guardar(tipo, id, !habilitado);
      client.setQueryData<Awaited<ReturnType<typeof getMetaLeadSources>>>(key, (data) => data ? {
        ...data,
        [tipo]: data[tipo].map((item) => item.id === id ? { ...item, importarLeadsAutomaticamente: !habilitado } : item),
      } : data);
    },
    successMessage: "Preferencia de importación guardada",
    invalidateKeys: [key],
  });

  if (query.isError) return <button type="button" onClick={() => query.refetch()} className="text-sm text-error-500">Reintentar preferencias</button>;
  return <div className="space-y-1">
    <button
      type="button"
      role="switch"
      aria-checked={habilitado}
      aria-label={`Importar leads automáticamente de ${nombre}`}
      disabled={!origen || query.isFetching || mutation.isPending}
      onClick={() => mutation.mutate()}
      className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-50 ${habilitado ? "border-success-500 text-success-600" : "border-gray-300 text-gray-500"}`}
    >
      {mutation.isPending ? "Guardando…" : !origen ? "Cargando…" : habilitado ? "Activado" : "Desactivado"}
    </button>
    {paginaDesactivada && <p className="text-xs text-warning-500">Bloqueado por la página</p>}
  </div>;
}
