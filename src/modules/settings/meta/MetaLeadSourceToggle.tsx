"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Switch from "@/src/components/form/switch/Switch";
import { getMetaLeadSources } from "./queries";
import { setMetaLeadSourceAction } from "./actions";
import { unwrapServerAction } from "@/src/lib/action-result";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";

const key = ["meta", "lead-sources"] as const;
const guardar = unwrapServerAction(setMetaLeadSourceAction);

export default function MetaLeadSourceToggle({ tipo, id, nombre, paginaId, label }: {
  tipo: "paginas" | "campanas" | "formularios";
  id: string;
  nombre: string;
  paginaId?: string;
  /** Texto visible junto al switch; sin él solo se muestra el switch (tablas). */
  label?: string;
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

  if (query.isError) {
    return (
      <button type="button" onClick={() => query.refetch()} className="text-theme-sm font-medium text-error-500 hover:underline">
        Reintentar
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <Switch
        label={label}
        ariaLabel={`Importar leads automáticamente de ${nombre}`}
        checked={habilitado}
        disabled={!origen || mutation.isPending}
        onChange={() => mutation.mutate()}
      />
      {paginaDesactivada && <p className="text-theme-xs text-warning-500">Bloqueado por la página</p>}
    </div>
  );
}
