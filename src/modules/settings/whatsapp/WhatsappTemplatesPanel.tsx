"use client";

import { useRef, useState } from "react";
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

// Las 3 categorías que existen en WhatsApp Business Platform — no hay más
// (Meta for Developers, "Aspectos básicos de las plantillas", vigente en v26).
const CATEGORIAS = [
  { value: "UTILITY", label: "Utilidad — seguimiento de una acción del usuario (confirmaciones, alertas)" },
  { value: "MARKETING", label: "Marketing — promociones, ofertas, retargeting" },
  { value: "AUTHENTICATION", label: "Autenticación — códigos de un solo uso (OTP)" },
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

// Variables más comunes en un seguimiento de leads (inmobiliaria, el único
// rubro soportado hoy) — un punto de partida con un clic; el usuario sigue
// pudiendo escribir cualquier otro nombre a mano o con "Otra variable" abajo.
const VARIABLES_SUGERIDAS = [
  "nombre_cliente",
  "nombre_proyecto",
  "asesor",
  "fecha_visita",
  "direccion",
  "numero_referencia",
  "monto",
  "telefono_contacto",
];

const PATRON_NOMBRE_VALIDO = /^[a-z][a-z0-9_]*$/;

/** Variables con nombre {{nombre_cliente}} de un texto: minúsculas, números
 * y guiones bajos, empezando con letra — así quien escribe la plantilla
 * define él mismo qué representa cada variable, en vez de adivinar qué es
 * {{1}} o {{2}} (WhatsApp Business Platform, formato "named", vigente v26). */
function extraerVariables(texto: string | undefined): { validas: string[]; invalidas: string[] } {
  const validas: string[] = [];
  const invalidas: string[] = [];
  if (!texto) return { validas, invalidas };
  for (const m of texto.matchAll(/\{\{([^{}]+)\}\}/g)) {
    const nombre = m[1].trim();
    if (PATRON_NOMBRE_VALIDO.test(nombre)) {
      if (!validas.includes(nombre)) validas.push(nombre);
    } else if (!invalidas.includes(nombre)) {
      invalidas.push(nombre);
    }
  }
  return { validas, invalidas };
}

/** Inserta {{nombre}} en la posición del cursor (no al final) y deja el
 * cursor justo después de lo insertado — igual que autocompletar en un
 * editor de texto normal. */
function insertarEnCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  valorActual: string,
  nombreVariable: string,
  aplicar: (nuevoValor: string) => void,
) {
  const token = `{{${nombreVariable}}}`;
  if (!el) {
    aplicar(`${valorActual}${token}`);
    return;
  }
  const inicio = el.selectionStart ?? valorActual.length;
  const fin = el.selectionEnd ?? valorActual.length;
  const nuevoValor = valorActual.slice(0, inicio) + token + valorActual.slice(fin);
  aplicar(nuevoValor);
  const posicionFinal = inicio + token.length;
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(posicionFinal, posicionFinal);
  });
}

/** Chips para insertar variables con un clic + un campo para una variable
 * propia, cuando ninguna de las sugeridas encaja. */
function SelectorDeVariables({
  onInsertar,
  soloUna = false,
}: {
  onInsertar: (nombre: string) => void;
  /** true para el encabezado — Meta solo admite una variable ahí. */
  soloUna?: boolean;
}) {
  const [personalizada, setPersonalizada] = useState("");
  const personalizadaValida = personalizada.length === 0 || PATRON_NOMBRE_VALIDO.test(personalizada);

  const agregarPersonalizada = () => {
    if (!personalizada || !personalizadaValida) return;
    onInsertar(personalizada);
    setPersonalizada("");
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {VARIABLES_SUGERIDAS.map((nombre) => (
        <button
          key={nombre}
          type="button"
          onClick={() => onInsertar(nombre)}
          className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-theme-xs text-brand-600 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
        >
          {`{{${nombre}}}`}
        </button>
      ))}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={personalizada}
          onChange={(e) => setPersonalizada(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarPersonalizada();
            }
          }}
          placeholder="otra_variable"
          className="h-7 w-32 rounded-full border border-gray-300 bg-transparent px-2.5 text-theme-xs text-gray-700 outline-none focus:border-brand-300 dark:border-gray-700 dark:text-white/80"
        />
        <button
          type="button"
          onClick={agregarPersonalizada}
          disabled={!personalizada || !personalizadaValida}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
          title={soloUna ? "Agregar variable" : "Agregar otra variable"}
        >
          <Icon name="mdi:plus" size={14} />
        </button>
      </div>
    </div>
  );
}

export default function WhatsappTemplatesPanel() {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<CrearPlantillaInput>(VACIO);
  const cuerpoRef = useRef<HTMLTextAreaElement>(null);
  const encabezadoRef = useRef<HTMLInputElement>(null);

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
  const cuerpoVars = extraerVariables(form.cuerpo);
  const encabezadoVars = extraerVariables(form.encabezado);
  const ejemplosCuerpoCompletos =
    cuerpoVars.validas.length === 0 ||
    (form.ejemplosCuerpo ?? []).length === cuerpoVars.validas.length &&
      (form.ejemplosCuerpo ?? []).every((v) => v.trim().length > 0);
  const ejemploEncabezadoCompleto =
    encabezadoVars.validas.length === 0 || !!form.ejemploEncabezado?.trim();
  const puedeEnviar =
    nombreValido &&
    form.cuerpo.trim().length > 0 &&
    cuerpoVars.invalidas.length === 0 &&
    encabezadoVars.invalidas.length === 0 &&
    encabezadoVars.validas.length <= 1 &&
    ejemplosCuerpoCompletos &&
    ejemploEncabezadoCompleto;

  const aplicarNuevoCuerpo = (cuerpo: string) => {
    const vars = extraerVariables(cuerpo);
    setForm((f) => {
      const previos = f.ejemplosCuerpo ?? [];
      const ejemplosCuerpo = vars.validas.map((_, i) => previos[i] ?? "");
      return { ...f, cuerpo, ejemplosCuerpo };
    });
  };

  const aplicarNuevoEncabezado = (encabezado: string) => {
    const vars = extraerVariables(encabezado);
    setForm((f) => ({
      ...f,
      encabezado,
      ejemploEncabezado: vars.validas.length > 0 ? f.ejemploEncabezado : "",
    }));
  };

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
                ref={encabezadoRef}
                id="encabezado"
                placeholder="¡Hola {{nombre_cliente}}!"
                value={form.encabezado}
                onChange={(e) => aplicarNuevoEncabezado(e.target.value)}
                error={encabezadoVars.validas.length > 1 || encabezadoVars.invalidas.length > 0}
                hint={
                  encabezadoVars.validas.length > 1
                    ? "El encabezado solo admite una variable — es un límite de Meta"
                    : encabezadoVars.invalidas.length > 0
                      ? `{{${encabezadoVars.invalidas[0]}}} no es válido — usa minúsculas y guion bajo, ej: {{nombre_cliente}}`
                      : undefined
                }
              />
              {encabezadoVars.validas.length === 0 && (
                <SelectorDeVariables
                  soloUna
                  onInsertar={(nombre) =>
                    insertarEnCursor(encabezadoRef.current, form.encabezado ?? "", nombre, aplicarNuevoEncabezado)
                  }
                />
              )}
              {encabezadoVars.validas.length === 1 && (
                <div className="mt-2">
                  <Input
                    placeholder={`Ejemplo para {{${encabezadoVars.validas[0]}}} — ej: Juan`}
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
              ref={cuerpoRef}
              id="cuerpo"
              rows={3}
              placeholder="Hola {{nombre_cliente}}, gracias por tu interés en {{nombre_proyecto}}. ¿En qué te podemos ayudar?"
              value={form.cuerpo}
              onChange={(e) => aplicarNuevoCuerpo(e.target.value)}
              error={cuerpoVars.invalidas.length > 0}
              hint={
                cuerpoVars.invalidas.length > 0
                  ? `{{${cuerpoVars.invalidas[0]}}} no es válido — usa minúsculas y guion bajo, ej: {{nombre_cliente}}`
                  : "Toca una variable para agregarla donde esté el cursor, o escribí la tuya — minúsculas, números y " +
                    "guion bajo. Meta pide un ejemplo por cada una para saber qué esperar y aprobar la plantilla."
              }
            />
            <SelectorDeVariables
              onInsertar={(nombre) =>
                insertarEnCursor(cuerpoRef.current, form.cuerpo, nombre, aplicarNuevoCuerpo)
              }
            />
            {cuerpoVars.validas.length > 0 && (
              <div className="mt-2 space-y-2">
                {cuerpoVars.validas.map((nombre, i) => (
                  <Input
                    key={nombre}
                    placeholder={`Ejemplo para {{${nombre}}}`}
                    value={(form.ejemplosCuerpo ?? [])[i] ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ejemplosCuerpo: cuerpoVars.validas.map((_, idx) =>
                          idx === i ? e.target.value : ((f.ejemplosCuerpo ?? [])[idx] ?? ""),
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
