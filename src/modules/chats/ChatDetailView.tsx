"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";
import Select from "@/src/components/form/Select";
import { Icon } from "@/src/components/ui/Icon";
import { Spinner } from "@/src/components/ui/Spinner";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { enviarMensajeAction, enviarMediaAction } from "./actions";
import { getChat, getTemplates } from "./queries";
import type { Mensaje } from "./types";

const INTERVALO_REFRESCO_MS = 10_000;

// Mismo criterio visual que WhatsApp: 1 check = enviado, 2 checks gris =
// entregado, 2 checks AZULES = leído (si el destinatario tiene los recibos
// de lectura desactivados, Meta nunca manda "read" y se queda en
// "entregado" para siempre — no es un bug de acá, es una opción del usuario
// de WhatsApp del otro lado).
const ICONO_ESTADO: Record<string, { icon: string; className?: string }> = {
  enviado: { icon: "mdi:check" },
  entregado: { icon: "mdi:check-all" },
  leido: { icon: "mdi:check-all", className: "text-sky-300" },
  fallido: { icon: "mdi:alert-circle-outline", className: "text-error-300" },
  eliminado: { icon: "mdi:trash-can-outline" },
};

// Mismos límites reales de la Media API de WhatsApp que valida el backend —
// se repiten acá para avisar al toque, sin esperar el viaje al servidor.
const LIMITES_MEDIA: Record<string, { maxBytes: number; mimes: string[] }> = {
  image: { maxBytes: 5 * 1024 * 1024, mimes: ["image/jpeg", "image/png"] },
  video: { maxBytes: 16 * 1024 * 1024, mimes: ["video/mp4", "video/3gpp"] },
  audio: {
    maxBytes: 16 * 1024 * 1024,
    mimes: ["audio/aac", "audio/mp4", "audio/mpeg", "audio/amr", "audio/ogg"],
  },
  document: {
    maxBytes: 100 * 1024 * 1024,
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
  },
};

function validarArchivo(file: File): string | null {
  const categoria = Object.entries(LIMITES_MEDIA).find(([, l]) => l.mimes.includes(file.type));
  if (!categoria) return `WhatsApp no admite este tipo de archivo (${file.type || "desconocido"})`;
  const [, limite] = categoria;
  if (file.size > limite.maxBytes) {
    return `El archivo pesa más de ${Math.round(limite.maxBytes / (1024 * 1024)) || 0.5}MB, el máximo que admite WhatsApp para este tipo`;
  }
  return null;
}

function estaDentroDeVentana(ventanaExpiraEn: string | null | undefined): boolean {
  return !!ventanaExpiraEn && new Date(ventanaExpiraEn).getTime() > Date.now();
}

/** Nombres de variable {{nombre_cliente}} (o {{1}}, {{2}} en plantillas
 * legacy creadas fuera del CRM) en orden de primera aparición, sin
 * duplicados — se muestran tal cual, así el usuario ve exactamente qué
 * variable está llenando. */
function extraerVariables(texto: string | undefined): string[] {
  if (!texto) return [];
  const nombres: string[] = [];
  for (const m of texto.matchAll(/\{\{([^{}]+)\}\}/g)) {
    const nombre = m[1].trim();
    if (!nombres.includes(nombre)) nombres.push(nombre);
  }
  return nombres;
}

function formatearHora(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatearTamano(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function urlMedia(conversacionId: string, mensajeId: string) {
  return `/api/whatsapp/media/${conversacionId}/${mensajeId}`;
}

function ContenidoMedia({ mensaje, conversacionId }: { mensaje: Mensaje; conversacionId: string }) {
  if (!mensaje.tieneMedia) return null;
  const src = urlMedia(conversacionId, mensaje.id);

  if (mensaje.tipo === "image" || mensaje.tipo === "sticker") {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- viene de un proxy propio, no de un dominio remoto configurable */}
        <img src={src} alt={mensaje.mediaCaption ?? "Imagen"} className="max-h-72 rounded-lg object-contain" />
      </a>
    );
  }
  if (mensaje.tipo === "video") {
    return <video src={src} controls className="max-h-72 max-w-full rounded-lg" />;
  }
  if (mensaje.tipo === "audio") {
    return (
      <div className="flex items-center gap-2">
        {mensaje.mediaEsVoz && <Icon name="mdi:microphone" size={18} />}
        <audio src={src} controls className="h-10 max-w-[240px]" />
      </div>
    );
  }
  // document u otro tipo con archivo
  return (
    <a
      href={src}
      download={mensaje.mediaNombreArchivo ?? undefined}
      className="flex items-center gap-2.5 rounded-lg bg-black/5 px-3 py-2.5 transition hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
    >
      <Icon name="mdi:file-document-outline" size={28} />
      <div className="min-w-0">
        <p className="truncate text-theme-sm font-medium">{mensaje.mediaNombreArchivo ?? "Documento"}</p>
        <p className="text-theme-xs opacity-70">{formatearTamano(mensaje.mediaTamanoBytes)}</p>
      </div>
      <Icon name="mdi:download" size={18} className="ml-1 shrink-0" />
    </a>
  );
}

function Burbuja({ mensaje, conversacionId }: { mensaje: Mensaje; conversacionId: string }) {
  const esSaliente = mensaje.direccion === "saliente";
  return (
    <div className={`flex ${esSaliente ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] space-y-1.5 rounded-2xl px-4 py-2.5 text-theme-sm ${
          esSaliente
            ? "bg-brand-500 text-white"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {mensaje.tipo === "template" && mensaje.plantillaNombre ? (
          <p className="flex items-center gap-1 text-theme-xs opacity-80">
            <Icon name="mdi:script-text-outline" size={14} />
            Plantilla: {mensaje.plantillaNombre}
          </p>
        ) : null}
        <ContenidoMedia mensaje={mensaje} conversacionId={conversacionId} />
        {(mensaje.texto || mensaje.mediaCaption) && (
          <p className="whitespace-pre-wrap break-words">{mensaje.texto ?? mensaje.mediaCaption}</p>
        )}
        {!mensaje.tieneMedia && !mensaje.texto && (
          <p className="whitespace-pre-wrap break-words opacity-70">(sin texto)</p>
        )}
        <div className="flex items-center justify-end gap-1 text-theme-xs opacity-70">
          {formatearHora(mensaje.fechaMensaje)}
          {esSaliente &&
            (() => {
              const estado = mensaje.estadoEntrega ? ICONO_ESTADO[mensaje.estadoEntrega] : undefined;
              return (
                <Icon
                  name={estado?.icon ?? "mdi:clock-outline"}
                  size={14}
                  className={estado?.className}
                />
              );
            })()}
        </div>
      </div>
    </div>
  );
}

export default function ChatDetailView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");
  const [valoresVariables, setValoresVariables] = useState<Record<string, string>>({});
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const chatQuery = useQuery({
    queryKey: queryKeys.whatsappChat(id),
    queryFn: () => getChat(id),
    refetchInterval: INTERVALO_REFRESCO_MS,
  });

  const dentroDeVentana = estaDentroDeVentana(chatQuery.data?.ventanaExpiraEn);

  const templatesQuery = useQuery({
    queryKey: queryKeys.whatsappTemplates,
    queryFn: getTemplates,
    enabled: !dentroDeVentana,
  });

  const plantilla = templatesQuery.data?.find((p) => p.nombre === plantillaSeleccionada);
  const variables = extraerVariables(plantilla?.cuerpoTexto);
  const parametrosCompletos = variables.every((nombre) => (valoresVariables[nombre] ?? "").trim().length > 0);

  const enviar = useAppMutation({
    mutationFn: async () => {
      if (dentroDeVentana) {
        await enviarMensajeAction(id, { texto });
      } else {
        if (!plantilla) throw new Error("Elige una plantilla aprobada");
        await enviarMensajeAction(id, {
          plantillaNombre: plantilla.nombre,
          plantillaIdioma: plantilla.idioma,
          plantillaFormatoParametros: plantilla.formatoParametros,
          parametros:
            variables.length > 0
              ? variables.map((nombre) => ({ nombre, valor: valoresVariables[nombre] ?? "" }))
              : undefined,
        });
      }
    },
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  const enviarArchivo = useAppMutation({
    mutationFn: async () => {
      if (!archivo) return;
      const formData = new FormData();
      formData.append("archivo", archivo);
      if (texto.trim()) formData.append("caption", texto.trim());
      await enviarMediaAction(id, formData);
    },
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [chatQuery.data?.mensajes.length]);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChats });
    };
  }, [queryClient]);

  if (chatQuery.isLoading) return <PageLoader />;
  if (chatQuery.isError) return <QueryError error={chatQuery.error} />;
  if (!chatQuery.data) return null;

  const chat = chatQuery.data;
  const nombre = chat.lead?.nombre ?? chat.nombreContacto ?? chat.waId;

  function elegirArchivo(file: File | undefined) {
    if (!file) return;
    const error = validarArchivo(file);
    setErrorArchivo(error);
    setArchivo(error ? null : file);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <Link href="/chats" className="text-gray-500 md:hidden" aria-label="Volver a chats">
          <Icon name="mdi:arrow-left" size={20} />
        </Link>
        <Avatar name={nombre} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{nombre}</p>
          {chat.lead ? (
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">+{chat.waId} · Lead vinculado</p>
          ) : (
            <p className="text-theme-xs text-warning-500">+{chat.waId} · Sin lead vinculado</p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {chat.mensajes.length === 0 ? (
          <p className="text-center text-theme-sm text-gray-500 dark:text-gray-400">
            Todavía no hay mensajes en esta conversación.
          </p>
        ) : (
          chat.mensajes.map((mensaje) => <Burbuja key={mensaje.id} mensaje={mensaje} conversacionId={id} />)
        )}
        <div ref={finRef} />
      </div>

      <div className="border-t border-gray-100 p-3 dark:border-gray-800 sm:p-4">
        {dentroDeVentana ? (
          <form
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              if (archivo) {
                enviarArchivo.mutate(undefined, {
                  onSuccess: () => {
                    setArchivo(null);
                    setTexto("");
                    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
                  },
                });
              } else if (texto.trim()) {
                enviar.mutate(undefined, { onSuccess: () => setTexto("") });
              }
            }}
            className="space-y-2"
          >
            {archivo && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-theme-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                <Icon
                  name={
                    archivo.type.startsWith("image/")
                      ? "mdi:image-outline"
                      : archivo.type.startsWith("video/")
                        ? "mdi:video-outline"
                        : archivo.type.startsWith("audio/")
                          ? "mdi:music-note-outline"
                          : "mdi:file-document-outline"
                  }
                  size={18}
                />
                <span className="min-w-0 flex-1 truncate">{archivo.name}</span>
                <span className="shrink-0 opacity-70">{formatearTamano(archivo.size)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setArchivo(null);
                    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
                  }}
                  className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Quitar archivo"
                >
                  <Icon name="mdi:close" size={16} />
                </button>
              </div>
            )}
            {errorArchivo && <p className="text-theme-xs text-error-500">{errorArchivo}</p>}
            <div className="flex items-end gap-2">
              <input
                ref={inputArchivoRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,video/mp4,video/3gpp,audio/aac,audio/mp4,audio/mpeg,audio/amr,audio/ogg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => elegirArchivo(e.target.files?.[0])}
              />
              <div className="flex flex-1 items-end gap-0.5 rounded-3xl border border-gray-200 bg-white pl-1 pr-1.5 py-1 dark:border-gray-700 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => inputArchivoRef.current?.click()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                  aria-label="Adjuntar archivo"
                >
                  <Icon name="mdi:plus" size={22} />
                </button>
                <textarea
                  value={texto}
                  onChange={(event) => setTexto(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  placeholder={archivo ? "Agrega un texto (opcional)…" : "Escribe un mensaje…"}
                  rows={1}
                  className="max-h-32 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-theme-sm text-gray-800 outline-none dark:text-white/90"
                />
              </div>
              <button
                type="submit"
                disabled={(!archivo && !texto.trim()) || enviar.isPending || enviarArchivo.isPending}
                aria-label="Enviar mensaje"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300 dark:disabled:bg-brand-500/40"
              >
                {enviar.isPending || enviarArchivo.isPending ? (
                  <Spinner size={18} />
                ) : (
                  <Icon name="mdi:send" size={19} className="translate-x-px" />
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-theme-xs text-warning-500">
              <Icon name="mdi:clock-alert-outline" size={14} />
              Pasaron 24h desde el último mensaje del contacto — hace falta enviar una plantilla aprobada.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  options={(templatesQuery.data ?? []).map((t) => ({
                    value: t.nombre,
                    label: `${t.nombre} (${t.idioma})`,
                  }))}
                  placeholder={
                    templatesQuery.isLoading ? "Cargando plantillas…" : "Elige una plantilla aprobada"
                  }
                  value={plantillaSeleccionada}
                  onChange={(valor) => {
                    setPlantillaSeleccionada(valor);
                    setValoresVariables({});
                  }}
                />
              </div>
              {variables.length === 0 && (
                <Button
                  type="button"
                  size="sm"
                  loading={enviar.isPending}
                  disabled={!plantillaSeleccionada}
                  onClick={() =>
                    enviar.mutate(undefined, {
                      onSuccess: () => {
                        setPlantillaSeleccionada("");
                        setValoresVariables({});
                      },
                    })
                  }
                >
                  Enviar plantilla
                </Button>
              )}
            </div>
            {plantilla && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-theme-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                {plantilla.cuerpoTexto}
              </p>
            )}
            {variables.length > 0 && (
              <div className="space-y-2">
                {variables.map((nombre) => (
                  <Input
                    key={nombre}
                    placeholder={`Valor para {{${nombre}}}`}
                    value={valoresVariables[nombre] ?? ""}
                    onChange={(e) =>
                      setValoresVariables((prev) => ({ ...prev, [nombre]: e.target.value }))
                    }
                  />
                ))}
                <Button
                  type="button"
                  size="sm"
                  loading={enviar.isPending}
                  disabled={!plantillaSeleccionada || !parametrosCompletos}
                  onClick={() =>
                    enviar.mutate(undefined, {
                      onSuccess: () => {
                        setPlantillaSeleccionada("");
                        setValoresVariables({});
                      },
                    })
                  }
                >
                  Enviar plantilla
                </Button>
              </div>
            )}
            {templatesQuery.data?.length === 0 && (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                No hay plantillas aprobadas — créalas en Meta Business Suite primero.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
