"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/src/components/ui/button/Button";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { DetailPageSkeleton, ListItemSkeleton } from "@/src/components/ui/skeletons";
import { QueryError } from "@/src/components/ui/PageLoader";
import { canManageOrganization } from "@/src/lib/roles";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import EstadoPipelineBadge from "@/src/modules/leads/EstadoPipelineBadge";
import { deleteInmuebleAction } from "./actions";
import InmuebleForm from "./InmuebleForm";
import { getInmueble, getInmuebleInteresados } from "./queries";
import {
  etiquetaEstadoInmueble,
  etiquetaOperacionInmueble,
  etiquetaTipoInmueble,
  formatearPrecioInmueble,
  type InmuebleInteresadoRankeado,
  type OrigenInteresInmueble,
} from "./types";

function colorEstado(estado: string): "success" | "warning" | "error" | "light" {
  if (estado === "DISPONIBLE") return "success";
  if (estado === "RESERVADO") return "warning";
  if (estado === "VENDIDO") return "error";
  return "light";
}

function etiquetaOrigen(origen: OrigenInteresInmueble): string {
  if (origen === "interes") return "Interés";
  if (origen === "visita") return "Visita";
  return "Interés + visita";
}

function colorOrigen(origen: OrigenInteresInmueble): "info" | "warning" | "success" {
  if (origen === "interes") return "info";
  if (origen === "visita") return "warning";
  return "success";
}

function InteresadosSection({ inmuebleId }: { inmuebleId: string }) {
  const query = useQuery({
    queryKey: queryKeys.inmuebleInteresados(inmuebleId),
    queryFn: () => getInmuebleInteresados(inmuebleId),
  });

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon name="mdi:account-star-outline" size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Interesados
          </h2>
          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
            Ordenados por probabilidad de adquisición (el #1 es el más cercano a cerrar).
          </p>
        </div>
      </div>

      {query.isLoading ? (
        <ListItemSkeleton count={5} />
      ) : query.isError ? (
        <QueryError error={query.error} />
      ) : !query.data?.length ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-theme-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Aún no hay leads con interés o visitas a este inmueble.
        </p>
      ) : (
        <ol className="divide-y divide-gray-100 dark:divide-gray-800">
          {query.data.map((item: InmuebleInteresadoRankeado, index: number) => (
            <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-theme-sm font-semibold ${
                  index === 0
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
                aria-label={`Puesto ${index + 1}`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/leads/${item.id}`}
                    className="truncate text-theme-sm font-medium text-gray-800 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400"
                  >
                    {item.nombre}
                  </Link>
                  <Badge size="sm" color={colorOrigen(item.origen)}>
                    {etiquetaOrigen(item.origen)}
                  </Badge>
                  <EstadoPipelineBadge
                    tipoLead={item.tipoLead}
                    estado={item.estadoGestion}
                  />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  {item.telefono ? <span>{item.telefono}</span> : null}
                  {item.motivoRanking?.length ? (
                    <span className="truncate">{item.motivoRanking.slice(0, 2).join(" · ")}</span>
                  ) : null}
                </div>
              </div>
              <Link
                href={`/leads/${item.id}`}
                className="shrink-0 self-center text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Ver lead
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function InmuebleDetailView({
  id,
  rol,
  editMode = false,
}: {
  id: string;
  rol: string | null;
  editMode?: boolean;
}) {
  const puedeEditar = canManageOrganization(rol);
  const query = useQuery({
    queryKey: queryKeys.inmueble(id),
    queryFn: () => getInmueble(id),
  });

  const deleteMutation = useAppMutation({
    mutationFn: () => deleteInmuebleAction(id),
    successMessage: "Inmueble eliminado",
    invalidateKeys: [queryKeys.inmueblesAll, queryKeys.inmueblesFiltro],
    redirectTo: "/inmuebles",
  });

  if (query.isLoading) return <DetailPageSkeleton />;
  if (query.isError) return <QueryError error={query.error} />;
  if (!query.data) return null;

  const row = query.data;

  if (editMode && puedeEditar) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Editar ${row.codigo}`}
          description={row.titulo}
          backHref={`/inmuebles/${row.id}`}
          backLabel="Volver al inmueble"
        />
        <InmuebleForm mode="edit" inmueble={row} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={row.codigo}
        description={row.titulo}
        backHref="/inmuebles"
        backLabel="Volver a inmuebles"
      >
        {puedeEditar ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/inmuebles/${row.id}/editar`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300"
            >
              <Icon name="mdi:pencil-outline" size={18} />
              Editar
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={deleteMutation.isPending}
              startIcon={<Icon name="mdi:trash-can-outline" size={18} />}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        ) : null}
      </PageHeader>

      <InteresadosSection inmuebleId={row.id} />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge size="sm" color={colorEstado(row.estadoInmueble)}>
            {etiquetaEstadoInmueble(row.estadoInmueble)}
          </Badge>
          <Badge size="sm" color="light">
            {etiquetaTipoInmueble(row.tipo)}
          </Badge>
          <Badge size="sm" color="info">
            {etiquetaOperacionInmueble(row.operacion)}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-theme-xs text-gray-500">Zona</dt>
            <dd className="mt-0.5 text-theme-sm text-gray-800 dark:text-white/90">
              {row.zona || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-500">Dirección</dt>
            <dd className="mt-0.5 text-theme-sm text-gray-800 dark:text-white/90">
              {row.direccion || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-500">Precio</dt>
            <dd className="mt-0.5 text-theme-sm text-gray-800 dark:text-white/90">
              {formatearPrecioInmueble(row.precio, row.moneda)}
            </dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-500">Moneda</dt>
            <dd className="mt-0.5 text-theme-sm text-gray-800 dark:text-white/90">
              {row.moneda}
            </dd>
          </div>
          {row.notas ? (
            <div className="sm:col-span-2">
              <dt className="text-theme-xs text-gray-500">Notas</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-theme-sm text-gray-800 dark:text-white/90">
                {row.notas}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
