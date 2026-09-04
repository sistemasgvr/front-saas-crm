"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/src/components/ui/button/Button";
import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { canManageOrganization } from "@/src/lib/roles";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { deleteInmuebleAction } from "./actions";
import InmuebleForm from "./InmuebleForm";
import { getInmueble } from "./queries";
import {
  etiquetaEstadoInmueble,
  etiquetaOperacionInmueble,
  etiquetaTipoInmueble,
  formatearPrecioInmueble,
} from "./types";

function colorEstado(estado: string): "success" | "warning" | "error" | "light" {
  if (estado === "DISPONIBLE") return "success";
  if (estado === "RESERVADO") return "warning";
  if (estado === "VENDIDO") return "error";
  return "light";
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

  if (query.isLoading) return <PageLoader />;
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
