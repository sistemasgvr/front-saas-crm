"use client";

import { useState } from "react";
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

/** Descarga un ZIP con un CSV por tabla y, opcionalmente, los archivos de WhatsApp. */
export default function DataExportCard() {
  const [elegidas, setElegidas] = useState<Set<CodigoSeccion>>(
    () => new Set(SECCIONES.map((s) => s.codigo)),
  );
  const [medios, setMedios] = useState(false);

  const alternar = (codigo: CodigoSeccion, activo: boolean) =>
    setElegidas((actual) => {
      const next = new Set(actual);
      if (activo) next.add(codigo);
      else next.delete(codigo);
      return next;
    });

  const incluyeChats = elegidas.has("chats");
  const params = new URLSearchParams({
    secciones: SECCIONES.filter((s) => elegidas.has(s.codigo))
      .map((s) => s.codigo)
      .join(","),
  });
  if (medios && incluyeChats) params.set("medios", "1");

  return (
    <CollapsibleSection
      title="Exportar datos"
      icon="mdi:database-export-outline"
      help="Descarga la información de tu empresa en archivos CSV dentro de un ZIP. Solo el propietario o un administrador puede hacerlo."
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
            disabled={!incluyeChats}
            onChange={setMedios}
          />
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            {incluyeChats
              ? "Puede tardar varios minutos y pesar bastante. chats/medios.csv indica a qué mensaje pertenece cada archivo."
              : "Marca Chats para poder incluir sus archivos."}
          </p>
        </div>

        {elegidas.size === 0 ? (
          <Button size="sm" disabled startIcon={<Icon name="mdi:download" size={18} />}>
            Descargar ZIP
          </Button>
        ) : (
          <a href={`/api/organizations/export?${params}`} download>
            <Button size="sm" startIcon={<Icon name="mdi:download" size={18} />}>
              Descargar ZIP
            </Button>
          </a>
        )}
      </div>
    </CollapsibleSection>
  );
}
