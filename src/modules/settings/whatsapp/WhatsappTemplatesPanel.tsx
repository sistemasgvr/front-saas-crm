"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";
import Label from "@/src/components/form/Label";
import Select from "@/src/components/form/Select";
import TextArea from "@/src/components/form/input/TextArea";
import { Icon } from "@/src/components/ui/Icon";
import EmptyState from "@/src/components/ui/EmptyState";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { crearPlantillaWhatsAppAction, type CrearPlantillaInput } from "./actions";
import { getPlantillasWhatsAppTodas } from "./queries";

const CATEGORIAS = [
  { value: "UTILITY", label: "Utilidad (seguimiento, confirmaciones)" },
  { value: "MARKETING", label: "Marketing (promociones, ofertas)" },
  { value: "AUTHENTICATION", label: "Autenticación (códigos OTP)" },
];

const IDIOMAS = [
  { value: "es", label: "Español" },
  { value: "es_PE", label: "Español (Perú)" },
  { value: "en_US", label: "Inglés (EE.UU.)" },
];

const ESTADO_COLOR: Record<string, "success" | "warning" | "error" | "light"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "error",
};

const ESTADO_LABEL: Record<string, string> = {
  APPROVED: "Aprobada",
  PENDING: "En revisión",
  REJECTED: "Rechazada",
};

const VACIO: CrearPlantillaInput = {
  nombre: "",
  categoria: "UTILITY",
  idioma: "es",
  cuerpo: "",
  ejemplosCuerpo: [],
  encabezado: "",
  ejemploEncabezado: "",
  pie: "",
};

function contarVariables(texto: string | undefined): number {
  if (!texto) return 0;
  const numeros = [...texto.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return numeros.length > 0 ? Math.max(...numeros) : 0;
}

export default function WhatsappTemplatesPanel() {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<CrearPlantillaInput>(VACIO);

  const plantillasQuery = useQuery({
    queryKey: queryKeys.whatsappTemplatesAll,
    queryFn: getPlantillasWhatsAppTodas,
  });

  const crear = useAppMutation({
    mutationFn: (input: CrearPlantillaInput) => crearPlantillaWhatsAppAction(input),
    successMessage: "Plantilla enviada a revisión de Meta",
    invalidateKeys: [queryKeys.whatsappTemplatesAll, queryKeys.whatsappTemplates],
  });

  const nombreValido = /^[a-z0-9_]+$/.test(form.nombre);
  const variablesCuerpo = contarVariables(form.cuerpo);
  const ejemplosCuerpoCompletos =
    variablesCuerpo === 0 || (form.ejemplosCuerpo ?? []).every((v) => v.trim().length > 0);
  const variableEncabezado = contarVariables(form.encabezado) > 0;
  const ejemploEncabezadoCompleto =
    !variableEncabezado || !!form.ejemploEncabezado?.trim();
  const puedeEnviar =
    nombreValido &&
    form.cuerpo.trim().length > 0 &&
    ejemplosCuerpoCompletos &&
    ejemploEncabezadoCompleto;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div>
          <h2 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
            Plantillas de mensajes
          </h2>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            Necesarias para escribirle primero a un lead o reabrir un chat después de 24h.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          startIcon={<Icon name={abierto ? "mdi:close" : "mdi:plus"} size={16} />}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? "Cancelar" : "Nueva plantilla"}
        </Button>
      </div>

      {abierto && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!puedeEnviar) return;
            crear.mutate(form, {
              onSuccess: () => {
                setForm(VACIO);
                setAbierto(false);
              },
            });
          }}
          className="space-y-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nombre">Nombre interno *</Label>
              <Input
                id="nombre"
                placeholder="primer_contacto_lead"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value.toLowerCase() }))}
                error={form.nombre.length > 0 && !nombreValido}
                hint={
                  form.nombre.length > 0 && !nombreValido
                    ? "Solo minúsculas, números y guiones bajos"
                    : undefined
                }
              />
            </div>
            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                options={CATEGORIAS}
                value={form.categoria}
                onChange={(v) => setForm((f) => ({ ...f, categoria: v as CrearPlantillaInput["categoria"] }))}
              />
            </div>
            <div>
              <Label htmlFor="idioma">Idioma</Label>
              <Select
                options={IDIOMAS}
                value={form.idioma}
                onChange={(v) => setForm((f) => ({ ...f, idioma: v }))}
              />
            </div>
            <div>
              <Label htmlFor="encabezado">Encabezado (opcional)</Label>
              <Input
                id="encabezado"
                placeholder="¡Hola {{1}}!"
                value={form.encabezado}
                onChange={(e) => {
                  const encabezado = e.target.value;
                  setForm((f) => ({
                    ...f,
                    encabezado,
                    ejemploEncabezado: contarVariables(encabezado) > 0 ? f.ejemploEncabezado : "",
                  }));
                }}
                error={contarVariables(form.encabezado) > 1}
                hint={
                  contarVariables(form.encabezado) > 1
                    ? "El encabezado solo admite una variable {{1}} (límite de Meta)"
                    : undefined
                }
              />
              {variableEncabezado && (
                <div className="mt-2">
                  <Input
                    placeholder="Ejemplo para {{1}} — ej: Juan"
                    value={form.ejemploEncabezado ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, ejemploEncabezado: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="cuerpo">Mensaje *</Label>
            <TextArea
              id="cuerpo"
              rows={3}
              placeholder="Hola {{1}}, gracias por tu interés en {{2}}. ¿En qué te podemos ayudar?"
              value={form.cuerpo}
              onChange={(e) => {
                const cuerpo = e.target.value;
                const n = contarVariables(cuerpo);
                setForm((f) => {
                  const previos = f.ejemplosCuerpo ?? [];
                  const ejemplosCuerpo = Array.from({ length: n }, (_, i) => previos[i] ?? "");
                  return { ...f, cuerpo, ejemplosCuerpo };
                });
              }}
              hint="Usa {{1}}, {{2}}… para variables — Meta pide un ejemplo por cada una para aprobar la plantilla."
            />
            {variablesCuerpo > 0 && (
              <div className="mt-2 space-y-2">
                {(form.ejemplosCuerpo ?? []).map((valor, i) => (
                  <Input
                    key={i}
                    placeholder={`Ejemplo para {{${i + 1}}}`}
                    value={valor}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ejemplosCuerpo: (f.ejemplosCuerpo ?? []).map((v, idx) =>
                          idx === i ? e.target.value : v,
                        ),
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="pie">Pie de página (opcional)</Label>
            <Input
              id="pie"
              placeholder="Domaria Inmobiliaria"
              value={form.pie}
              onChange={(e) => setForm((f) => ({ ...f, pie: e.target.value }))}
            />
          </div>
          <Button type="submit" size="sm" loading={crear.isPending} disabled={!puedeEnviar}>
            Enviar a revisión de Meta
          </Button>
        </form>
      )}

      <div className="px-5 py-4">
        {plantillasQuery.isLoading ? (
          <PageLoader />
        ) : plantillasQuery.isError ? (
          <QueryError error={plantillasQuery.error} />
        ) : plantillasQuery.data?.length === 0 ? (
          <EmptyState icon="mdi:script-text-outline" title="Todavía no hay plantillas" />
        ) : (
          <div className="space-y-2">
            {(plantillasQuery.data ?? []).map((plantilla) => (
              <div
                key={`${plantilla.nombre}-${plantilla.idioma}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {plantilla.nombre}
                  </p>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    {plantilla.categoria} · {plantilla.idioma}
                  </p>
                </div>
                <Badge color={ESTADO_COLOR[plantilla.estado] ?? "light"} size="sm">
                  {ESTADO_LABEL[plantilla.estado] ?? plantilla.estado}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
