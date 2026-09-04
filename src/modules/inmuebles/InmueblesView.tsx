"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/src/components/tables";
import Badge from "@/src/components/ui/badge/Badge";
import EmptyState from "@/src/components/ui/EmptyState";
import DynamicFilters from "@/src/components/ui/filters/DynamicFilters";
import type { DynamicFilterFieldDef, DynamicFilterValues } from "@/src/components/ui/filters/types";
import PageHeader from "@/src/components/ui/PageHeader";
import Pagination from "@/src/components/ui/Pagination";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import TableCard, { tdClass, tdPrimaryClass, thClass, thClassEnd } from "@/src/components/ui/TableCard";
import { canManageOrganization } from "@/src/lib/roles";
import { queryKeys } from "@/src/lib/query/keys";
import { getInmuebles } from "./queries";
import {
  ESTADOS_INMUEBLE_OPTIONS,
  OPERACIONES_INMUEBLE_OPTIONS,
  TIPOS_INMUEBLE_OPTIONS,
  etiquetaEstadoInmueble,
  etiquetaOperacionInmueble,
  etiquetaTipoInmueble,
  formatearPrecioInmueble,
} from "./types";

const PAGE_SIZE = 20;

const FIELDS: DynamicFilterFieldDef[] = [
  { key: "q", label: "Buscar", type: "text", placeholder: "Código, título, zona…" },
  {
    key: "tipo",
    label: "Tipo",
    type: "select",
    placeholder: "Todos",
    options: TIPOS_INMUEBLE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  },
  {
    key: "operacion",
    label: "Operación",
    type: "select",
    placeholder: "Todas",
    options: OPERACIONES_INMUEBLE_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
    })),
  },
  {
    key: "estadoInmueble",
    label: "Estado",
    type: "select",
    placeholder: "Todos",
    options: ESTADOS_INMUEBLE_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
    })),
  },
];

function colorEstado(estado: string): "success" | "warning" | "error" | "light" {
  if (estado === "DISPONIBLE") return "success";
  if (estado === "RESERVADO") return "warning";
  if (estado === "VENDIDO") return "error";
  return "light";
}

export default function InmueblesView({ rol }: { rol: string | null }) {
  const puedeEditar = canManageOrganization(rol);
  const [values, setValues] = useState<DynamicFilterValues>({});
  const [page, setPage] = useState(1);
  const deferredQ = useDeferredValue(values.q ?? "");

  const filtro = {
    page,
    pageSize: PAGE_SIZE,
    q: deferredQ.trim() || undefined,
    tipo: values.tipo || undefined,
    operacion: values.operacion || undefined,
    estadoInmueble: values.estadoInmueble || undefined,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.inmuebles(filtro),
    queryFn: () => getInmuebles(filtro),
  });
  const rows = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Inmuebles"
        description="Catálogo de propiedades para visitas y el embudo comercial."
        action={
          puedeEditar
            ? {
                href: "/inmuebles/nuevo",
                label: "Nuevo inmueble",
                icon: "mdi:home-plus-outline",
              }
            : undefined
        }
      >
        <DynamicFilters
          fields={FIELDS}
          values={values}
          onChange={(next) => {
            setValues(next);
            setPage(1);
          }}
        />
      </PageHeader>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <QueryError error={error} />
      ) : (
        <TableCard
          footer={
            data ? (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={setPage}
                itemLabel="inmuebles"
              />
            ) : null
          }
        >
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={thClass}>
                  Inmueble
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Tipo / Op.
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Precio
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Estado
                </TableCell>
                <TableCell isHeader className={thClassEnd}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 && (
                <EmptyState
                  colSpan={5}
                  icon="mdi:home-city-outline"
                  title="No hay inmuebles con estos filtros."
                  description={
                    puedeEditar
                      ? "Crea el primero para usarlo en visitas y el pipeline."
                      : "Pide a un administrador que cargue el catálogo."
                  }
                />
              )}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className={tdPrimaryClass}>
                    <Link
                      href={`/inmuebles/${row.id}`}
                      className="font-medium text-gray-800 hover:underline dark:text-white/90"
                    >
                      {row.codigo}
                    </Link>
                    <p className="mt-0.5 truncate text-theme-xs text-gray-500">
                      {row.titulo}
                      {row.zona ? ` · ${row.zona}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <span className="text-theme-sm text-gray-700 dark:text-gray-300">
                      {etiquetaTipoInmueble(row.tipo)}
                    </span>
                    <p className="text-theme-xs text-gray-500">
                      {etiquetaOperacionInmueble(row.operacion)}
                    </p>
                  </TableCell>
                  <TableCell className={tdClass}>
                    {formatearPrecioInmueble(row.precio, row.moneda)}
                  </TableCell>
                  <TableCell className={tdClass}>
                    <Badge size="sm" color={colorEstado(row.estadoInmueble)}>
                      {etiquetaEstadoInmueble(row.estadoInmueble)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex justify-end">
                      <TableAction
                        href={`/inmuebles/${row.id}`}
                        label="Ver"
                        icon="mdi:eye-outline"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
