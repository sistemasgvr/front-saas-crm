"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Checkbox from "@/src/components/form/input/Checkbox";
import Switch from "@/src/components/form/switch/Switch";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { Icon } from "@/src/components/ui/Icon";

const SECCIONES = [
  { codigo: "leads", nombre: "Leads", detalle: "Leads, historial, visitas, actividades y calificaciones" },
  { codigo: "chats", nombre: "Chats", detalle: "Conversaciones y mensajes de WhatsApp" },
  // TODO(llamadas): reactivar cuando el módulo de llamadas esté en uso (y en SECCIONES_EXPORT del backend).
  // { codigo: "llamadas", nombre: "Llamadas", detalle: "Historial de llamadas de WhatsApp" },
  { codigo: "inmuebles", nombre: "Inmuebles", detalle: "Catálogo de propiedades" },
  { codigo: "campanas", nombre: "Campañas", detalle: "Campañas, anuncios, formularios y métricas diarias" },
  { codigo: "usuarios", nombre: "Usuarios", detalle: "Miembros del equipo y su rol (sin contraseñas)" },
] as const;

type CodigoSeccion = (typeof SECCIONES)[number]["codigo"];

type Avance = { recibidos: number; estimado: number };

function formatoMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

function nombreArchivo(disposition: string | null): string {
  const m = disposition?.match(/filename="?([^";]+)"?/i);
  return m?.[1] ?? "exportacion-crm.zip";
}

/** Descarga un ZIP con un CSV por tabla y, opcionalmente, los archivos de WhatsApp. */
export default function DataExportCard() {
  const [elegidas, setElegidas] = useState<Set<CodigoSeccion>>(
    () => new Set(SECCIONES.map((s) => s.codigo)),
  );
  const [medios, setMedios] = useState(false);
  const [avance, setAvance] = useState<Avance | null>(null);
  const corte = useRef<AbortController | null>(null);

  // Si el usuario sale de la página, se corta la descarga (y el backend deja de trabajar).
  useEffect(() => () => corte.current?.abort(), []);

  const alternar = (codigo: CodigoSeccion, activo: boolean) =>
    setElegidas((actual) => {
      const next = new Set(actual);
      if (activo) next.add(codigo);
      else next.delete(codigo);
      return next;
    });

  const incluyeChats = elegidas.has("chats");
  const descargando = avance !== null;

  async function descargar() {
    const params = new URLSearchParams({
      secciones: SECCIONES.filter((s) => elegidas.has(s.codigo))
        .map((s) => s.codigo)
        .join(","),
    });
    if (medios && incluyeChats) params.set("medios", "1");

    const controlador = new AbortController();
    corte.current = controlador;
    setAvance({ recibidos: 0, estimado: 0 });
    try {
      const res = await fetch(`/api/organizations/export?${params}`, {
        signal: controlador.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.text()) || "No se pudo generar la exportación.");
      }
      const estimado = Number(res.headers.get("X-Export-Estimado")) || 0;
      const partes: Uint8Array<ArrayBuffer>[] = [];
      let recibidos = 0;
      setAvance({ recibidos, estimado });
      const lector = res.body.getReader();
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        partes.push(value);
        recibidos += value.byteLength;
        setAvance({ recibidos, estimado });
      }

      const url = URL.createObjectURL(new Blob(partes, { type: "application/zip" }));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo(res.headers.get("Content-Disposition"));
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(`Exportación lista (${formatoMb(recibidos)}).`);
    } catch (error) {
      if (controlador.signal.aborted) {
        toast.info("Exportación cancelada.");
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo generar la exportación.");
      }
    } finally {
      corte.current = null;
      setAvance(null);
    }
  }

  // El ZIP llega en streaming: el total es una estimación del backend, así que
  // la barra se detiene en 99 % hasta que termina de verdad.
  const porcentaje =
    avance && avance.estimado > 0
      ? Math.min(99, Math.floor((avance.recibidos / avance.estimado) * 100))
      : null;

  return (
    <CollapsibleSection
      title="Exportar datos"
      icon="mdi:database-export-outline"
      help="Descarga la información de tu empresa en archivos CSV dentro de un ZIP. Requiere el permiso «Exportar datos de la empresa»."
      preview="Descarga tus datos en CSV."
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {SECCIONES.map((s) => (
            <div key={s.codigo} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <Checkbox
                id={`export-${s.codigo}`}
                label={s.nombre}
                checked={elegidas.has(s.codigo)}
                disabled={descargando}
                onChange={(v) => alternar(s.codigo, v)}
              />
              <p className="mt-1 pl-8 text-theme-xs text-gray-500 dark:text-gray-400">{s.detalle}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <Switch
            label="Incluir archivos de los chats (imágenes, audios, documentos)"
            checked={medios && incluyeChats}
            disabled={!incluyeChats || descargando}
            onChange={setMedios}
          />
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            {incluyeChats
              ? "Puede tardar varios minutos y pesar bastante. Van en la carpeta chats/medios/ y chats/medios.csv indica a qué mensaje pertenece cada archivo."
              : "Marca Chats para poder incluir sus archivos."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="sm"
            disabled={elegidas.size === 0}
            loading={descargando}
            onClick={() => void descargar()}
            startIcon={<Icon name="mdi:download" size={18} />}
          >
            {descargando ? "Generando ZIP…" : "Descargar ZIP"}
          </Button>

          {avance && (
            <div className="flex min-w-0 flex-1 items-center gap-3" aria-live="polite">
              <div className="min-w-0 flex-1">
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
                  role="progressbar"
                  aria-label="Avance de la exportación"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={porcentaje ?? undefined}
                >
                  <div
                    className={`h-full rounded-full bg-brand-500 transition-[width] duration-300 ${porcentaje === null ? "w-1/3 animate-pulse" : ""}`}
                    style={porcentaje === null ? undefined : { width: `${Math.max(porcentaje, 2)}%` }}
                  />
                </div>
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  {avance.recibidos === 0
                    ? "Preparando los datos…"
                    : `${formatoMb(avance.recibidos)}${avance.estimado > 0 ? ` de ~${formatoMb(avance.estimado)}` : ""}${porcentaje !== null ? ` · ${porcentaje} %` : ""}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => corte.current?.abort()}
                className="shrink-0 text-theme-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}
