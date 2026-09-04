"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import EmojiPicker, { Theme as TemaEmojiPicker, type EmojiClickData } from "emoji-picker-react";
import type { Gif } from "gif-picker-react";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";
import Select from "@/src/components/form/Select";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import { Spinner } from "@/src/components/ui/Spinner";
import { QueryError } from "@/src/components/ui/PageLoader";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { useTheme } from "@/src/context/ThemeContext";
import {
  enviarMensajeAction,
  enviarMediaAction,
  enviarReaccionAction,
  enviarUbicacionAction,
  enviarContactoAction,
  enviarInteractivoAction,
  notificarEscribiendoAction,
  bloquearContactoAction,
  reenviarMensajesLoteAction,
  eliminarMensajeAction,
} from "./actions";
import { toast } from "sonner";
import { clearBorrador, getBorrador, setBorrador } from "./chat-borradores";
import { ComposerMediaPicker, type StickerPackItem } from "./ComposerMediaPicker";
import { desbloquearAudioChat, feedbackMensajeEnviado } from "./chat-feedback";
import { GrabadorNotaVoz } from "./grabar-nota-voz";
import {
  esFavorito,
  favoritoDesdeMensaje,
  quitarFavorito,
} from "./sticker-favoritos";
import { getChat, getTemplates, getChats } from "./queries";
import ChatLeadInmuebleChip from "./ChatLeadInmuebleChip";
import type {
  ConversacionDetalle,
  ConversacionResumen,
  ContactoMensaje,
  Interactivo,
  Mensaje,
  PlantillaWhatsApp,
  UbicacionMensaje,
} from "./types";

/** Alineado con multi-forward de WhatsApp y con la validación del action. */
const MAX_MENSAJES_REENVIAR = 30;
const INTERVALO_REFRESCO_MS = 10_000;
// El indicador de "escribiendo…" de Meta dura hasta 25s en el WhatsApp del
// contacto — refrescarlo cada 10s lo mantiene vivo sin gaps mientras el
// usuario sigue escribiendo, sin mandar una llamada por cada tecla.
const THROTTLE_ESCRIBIENDO_MS = 10_000;

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
  sticker: { maxBytes: 500 * 1024, mimes: ["image/webp"] },
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

/** Meta no tiene type=gif: preferimos MP4 del raw de Klipy; si no, el imageUrl si es video. */
function resolverFuenteGif(gif: Gif): { url: string; mime: string; nombre: string } | null {
  const raw = gif.raw as {
    file?: Record<string, { mp4?: { url?: string }; gif?: { url?: string } }>;
  } | null;
  const calidades = ["hd", "md", "sm", "xs"] as const;
  if (raw?.file) {
    for (const q of calidades) {
      const mp4Url = raw.file[q]?.mp4?.url;
      if (mp4Url) return { url: mp4Url, mime: "video/mp4", nombre: `${gif.id}.mp4` };
    }
  }
  const url = gif.imageUrl;
  if (/\.mp4(\?|$)/i.test(url) || /\/mp4/i.test(url)) {
    return { url, mime: "video/mp4", nombre: `${gif.id}.mp4` };
  }
  // Sin MP4 no podemos enviar por Cloud API (image/gif no está admitido).
  return null;
}

async function descargarComoArchivo(url: string, nombre: string, mime: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar el archivo (${res.status})`);
  const blob = await res.blob();
  return new File([blob], nombre, { type: mime || blob.type || "application/octet-stream" });
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

const ETIQUETA_TIPO_MEDIA: Record<string, string> = {
  image: "📷 Foto",
  video: "🎥 Video",
  audio: "🎵 Audio",
  document: "📄 Documento",
  sticker: "Sticker",
};

/** Texto corto para la burbujita de cita — mismo criterio que WhatsApp: el
 * texto si lo tiene, si no el caption del archivo, si no una etiqueta según
 * el tipo ("📷 Foto"…). Sirve tanto para un Mensaje completo como para el
 * MensajeCitado chico que ya viene resuelto del backend. */
function resumenCitado(citado: {
  texto: string | null;
  mediaCaption: string | null;
  tieneMedia: boolean;
  tipo: string;
}): string {
  if (citado.texto) return citado.texto;
  if (citado.mediaCaption) return citado.mediaCaption;
  if (citado.tipo === "location") return "📍 Ubicación";
  if (citado.tipo === "contacts") return "👤 Contacto";
  if (citado.tieneMedia) return ETIQUETA_TIPO_MEDIA[citado.tipo] ?? "📎 Archivo adjunto";
  return "(sin texto)";
}

function ContenidoUbicacion({ ubicacion }: { ubicacion: UbicacionMensaje }) {
  const urlMapa = `https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`;
  return (
    <a
      href={urlMapa}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-lg bg-black/5 px-3 py-2.5 transition hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
    >
      <Icon name="mdi:map-marker" size={26} className="shrink-0 text-error-500" />
      <div className="min-w-0">
        <p className="truncate text-theme-sm font-medium">{ubicacion.nombre ?? "Ubicación compartida"}</p>
        {ubicacion.direccion && <p className="truncate text-theme-xs opacity-70">{ubicacion.direccion}</p>}
        <p className="text-theme-xs opacity-70">Ver en el mapa</p>
      </div>
    </a>
  );
}

function ContenidoContactos({ contactos }: { contactos: ContactoMensaje[] }) {
  return (
    <div className="space-y-1.5">
      {contactos.map((contacto, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg bg-black/5 px-3 py-2.5 dark:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-200">
            <Icon name="mdi:account" size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-theme-sm font-medium">{contacto.nombre}</p>
            {contacto.telefonos[0] && (
              <p className="truncate text-theme-xs opacity-70">{contacto.telefonos[0].numero}</p>
            )}
            {contacto.organizacion && (
              <p className="truncate text-theme-xs opacity-70">{contacto.organizacion}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Los 4 subtipos de "interactive" — siempre SALIENTES (solo el negocio
 * puede mandarlos, la Cloud API no tiene forma de mandarlos desde el lado
 * del contacto), así que no hace falta variar colores según dirección: la
 * burbuja siempre es bg-brand-500/texto blanco acá. El cuerpo del mensaje ya
 * se pinta con el bloque de texto normal (mensaje.texto = interactivo.cuerpo) —
 * esto solo agrega la parte visual de abajo (botones/lista/link/aviso). */
function ContenidoInteractivo({ interactivo }: { interactivo: Interactivo }) {
  const [listaAbierta, setListaAbierta] = useState(false);

  if (interactivo.subtipo === "button") {
    return (
      <div className="flex flex-wrap gap-1.5 border-t border-white/20 pt-2">
        {(interactivo.botones ?? []).map((b) => (
          <span
            key={b.id}
            className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-theme-xs font-medium"
          >
            {b.titulo}
          </span>
        ))}
      </div>
    );
  }
  if (interactivo.subtipo === "list") {
    const secciones = interactivo.secciones ?? [];
    return (
      <>
        <div className="border-t border-white/20 pt-2">
          <button
            type="button"
            onClick={() => setListaAbierta(true)}
            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-theme-xs font-medium transition hover:bg-white/20"
          >
            <Icon name="mdi:format-list-bulleted" size={14} />
            {interactivo.botonLista ?? "Ver opciones"}
          </button>
        </div>
        <Modal
          open={listaAbierta}
          onClose={() => setListaAbierta(false)}
          header={
            <div className="px-5 py-4">
              <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                {interactivo.botonLista ?? "Opciones"}
              </h3>
              {interactivo.cuerpo && (
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{interactivo.cuerpo}</p>
              )}
            </div>
          }
        >
          <div className="space-y-4 px-5 py-4">
            {secciones.length === 0 ? (
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Sin opciones</p>
            ) : (
              secciones.map((seccion, i) => (
                <div key={i} className="space-y-1.5">
                  {seccion.titulo && (
                    <p className="text-theme-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {seccion.titulo}
                    </p>
                  )}
                  <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
                    {seccion.filas.map((f) => (
                      <li key={f.id} className="px-3.5 py-2.5">
                        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{f.titulo}</p>
                        {f.descripcion && (
                          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{f.descripcion}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </Modal>
      </>
    );
  }
  if (interactivo.subtipo === "cta_url") {
    return (
      <a
        href={interactivo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-theme-xs font-medium transition hover:bg-white/20"
      >
        <Icon name="mdi:open-in-new" size={14} />
        {interactivo.textoBoton}
      </a>
    );
  }
  return (
    <p className="mt-1 flex items-center gap-1.5 text-theme-xs opacity-90">
      <Icon name="mdi:map-marker-radius-outline" size={14} />
      Botón para pedir ubicación
    </p>
  );
}

const TIPOS_MEDIA = new Set(["image", "video", "audio", "document", "sticker"]);

function ContenidoMedia({ mensaje, conversacionId }: { mensaje: Mensaje; conversacionId: string }) {
  if (!mensaje.tieneMedia) {
    // Media que no se pudo descargar (caducó el media_id de Meta, etc.) —
    // no dejar "(sin texto)": mostrar etiqueta del tipo.
    if (TIPOS_MEDIA.has(mensaje.tipo)) {
      return (
        <p className="flex items-center gap-1.5 text-theme-sm opacity-80">
          <Icon name="mdi:image-off-outline" size={18} />
          {ETIQUETA_TIPO_MEDIA[mensaje.tipo] ?? "Archivo adjunto"}
          <span className="text-theme-xs opacity-70">(no disponible)</span>
        </p>
      );
    }
    return null;
  }
  const src = urlMedia(conversacionId, mensaje.id);

  if (mensaje.tipo === "sticker") {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block w-fit">
        {/* eslint-disable-next-line @next/next/no-img-element -- viene de un proxy propio, no de un dominio remoto configurable */}
        <img
          src={src}
          alt="Sticker"
          className="max-h-56 max-w-56 object-contain drop-shadow-sm"
        />
      </a>
    );
  }
  if (mensaje.tipo === "image") {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block w-fit max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- viene de un proxy propio, no de un dominio remoto configurable */}
        <img
          src={src}
          alt={mensaje.mediaCaption ?? "Imagen"}
          className="max-h-48 max-w-[min(100%,280px)] rounded-lg object-contain"
        />
      </a>
    );
  }
  if (mensaje.tipo === "video") {
    return <video src={src} controls className="max-h-48 max-w-[min(100%,280px)] rounded-lg" />;
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

// Mismo puñado de 6 que ofrece WhatsApp real al mantener apretado un mensaje.
const EMOJIS_RAPIDOS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const ANCHO_PICKER = 320;
const ALTO_PICKER = 380;
const ANCHO_BARRA_RAPIDA = EMOJIS_RAPIDOS.length * 36 + 40;
const ALTO_BARRA_RAPIDA = 44;
const MARGEN_VIEWPORT = 8;

/**
 * Portal a document.body, posicionado con coordenadas reales de pantalla
 * (no CSS `absolute` anidado) — la lista de mensajes tiene su propio scroll
 * (`overflow-y-auto`), así que cualquier popover posicionado adentro se
 * recorta ahí sin importar el z-index. Con un portal + `position: fixed`
 * esto no pasa, sea cual sea la fila donde esté el mensaje.
 *
 * La barra rápida de 6 emojis es propia (no de la librería) — la propia
 * barra "reactions" de emoji-picker-react no está pintando sus botones acá
 * (probablemente un choque con los estilos globales del proyecto), así que
 * se arma a mano y la librería solo se usa para el picker completo detrás
 * del "+", su modo de uso más simple y más probado.
 */
function SelectorReacciones({
  anchorRef,
  onElegir,
  onCerrar,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onElegir: (emoji: string) => void;
  onCerrar: () => void;
}) {
  const [pickerCompleto, setPickerCompleto] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // useLayoutEffect, no useEffect — corre ANTES de pintar. Con useEffect el
  // primer pintado usaba la posición calculada para el tamaño anterior
  // (barra chica) y recién después se recalculaba para el picker completo,
  // provocando un salto visible al abrir "+". Así se calcula antes de que
  // el usuario vea nada.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const alto = pickerCompleto ? ALTO_PICKER : ALTO_BARRA_RAPIDA;
    const ancho = pickerCompleto ? ANCHO_PICKER : ANCHO_BARRA_RAPIDA;
    const hayEspacioArriba = rect.top - alto - MARGEN_VIEWPORT > 0;
    const left = Math.min(
      Math.max(rect.left, MARGEN_VIEWPORT),
      window.innerWidth - ancho - MARGEN_VIEWPORT,
    );
    setPos(
      hayEspacioArriba
        ? { bottom: window.innerHeight - rect.top + MARGEN_VIEWPORT, left }
        : { top: rect.bottom + MARGEN_VIEWPORT, left },
    );
  }, [anchorRef, pickerCompleto]);

  useEffect(() => {
    function onClickFuera(e: Event) {
      const objetivo = e.target as Node;
      if (panelRef.current?.contains(objetivo)) return;
      if (anchorRef.current?.contains(objetivo)) return;
      onCerrar();
    }
    function onScroll(e: Event) {
      // Con capture:true este handler también ve el scroll INTERNO del
      // propio picker (navegar sus categorías de emoji) — eso no debe
      // cerrarlo, solo el scroll de la lista de mensajes por afuera.
      const objetivo = e.target as Node;
      if (panelRef.current?.contains(objetivo)) return;
      onCerrar();
    }
    // capture:true — la lista de mensajes puede scrollear el mensaje ancla
    // lejos de donde calculamos la posición; más simple cerrar que
    // perseguirlo con un recálculo en cada scroll.
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("touchstart", onClickFuera, { passive: true });
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("touchstart", onClickFuera);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [onCerrar, anchorRef]);

  if (!pos || typeof document === "undefined") return null;

  return createPortal(
    <div ref={panelRef} className="fixed z-99999" style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}>
      {pickerCompleto ? (
        <EmojiPicker
          theme={theme === "dark" ? TemaEmojiPicker.DARK : TemaEmojiPicker.LIGHT}
          onEmojiClick={(data: EmojiClickData) => onElegir(data.emoji)}
          autoFocusSearch={false}
          searchPlaceholder="Busca un emoji"
          width={ANCHO_PICKER}
          height={ALTO_PICKER}
        />
      ) : (
        <div className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
          {EMOJIS_RAPIDOS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onElegir(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition hover:scale-125 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPickerCompleto(true)}
            title="Más emojis"
            aria-label="Ver más emojis"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-white/10"
          >
            <Icon name="mdi:plus" size={18} />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

/**
 * Picker unificado del composer (Emoji / GIF / Stickers) — portal fijo
 * para no quedar recortado por el scroll del chat.
 */
function SelectorComposerMedia({
  abierto,
  anchorRef,
  onEmoji,
  onGif,
  onSticker,
  onSubirSticker,
  onCerrar,
}: {
  abierto: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onEmoji: (emoji: string) => void;
  onGif: (gif: Gif) => void;
  onSticker: (sticker: StickerPackItem) => void;
  onSubirSticker: () => void;
  onCerrar: () => void;
}) {
  return (
    <ComposerMediaPicker
      abierto={abierto}
      anchorRef={anchorRef}
      onEmoji={onEmoji}
      onGif={onGif}
      onSticker={onSticker}
      onSubirSticker={onSubirSticker}
      onCerrar={onCerrar}
    />
  );
}

const ANCHO_MENU_ACCIONES = 200;
const ALTO_MENU_ACCIONES = 236;

/** El desplegable de "más acciones" del hover — mismo mecanismo de posición
 * (portal + coordenadas reales) que SelectorReacciones. */
function MenuAcciones({
  anchorRef,
  onResponder,
  onCopiar,
  onReenviar,
  onSeleccionar,
  onEliminar,
  onFavorito,
  esFavoritoSticker,
  onCerrar,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onResponder: () => void;
  onCopiar: () => void;
  onReenviar: () => void;
  onSeleccionar: () => void;
  onEliminar: () => void;
  onFavorito?: () => void;
  esFavoritoSticker?: boolean;
  onCerrar: () => void;
}) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const alto = onFavorito ? ALTO_MENU_ACCIONES + 36 : ALTO_MENU_ACCIONES;
    const hayEspacioArriba = rect.top - alto - MARGEN_VIEWPORT > 0;
    const left = Math.min(
      Math.max(rect.right - ANCHO_MENU_ACCIONES, MARGEN_VIEWPORT),
      window.innerWidth - ANCHO_MENU_ACCIONES - MARGEN_VIEWPORT,
    );
    setPos(
      hayEspacioArriba
        ? { bottom: window.innerHeight - rect.top + MARGEN_VIEWPORT, left }
        : { top: rect.bottom + MARGEN_VIEWPORT, left },
    );
  }, [anchorRef, onFavorito]);

  useEffect(() => {
    function onClickFuera(e: Event) {
      const objetivo = e.target as Node;
      if (panelRef.current?.contains(objetivo)) return;
      if (anchorRef.current?.contains(objetivo)) return;
      onCerrar();
    }
    function onScroll(e: Event) {
      const objetivo = e.target as Node;
      if (panelRef.current?.contains(objetivo)) return;
      onCerrar();
    }
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("touchstart", onClickFuera, { passive: true });
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("touchstart", onClickFuera);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [onCerrar, anchorRef]);

  if (!pos || typeof document === "undefined") return null;

  const items: {
    icon: string;
    label: string;
    onClick: () => void;
    danger?: boolean;
  }[] = [
    { icon: "mdi:reply-outline", label: "Responder", onClick: onResponder },
    { icon: "mdi:content-copy", label: "Copiar", onClick: onCopiar },
    { icon: "mdi:share-outline", label: "Reenviar", onClick: onReenviar },
    { icon: "mdi:checkbox-marked-outline", label: "Seleccionar", onClick: onSeleccionar },
  ];
  if (onFavorito) {
    items.push({
      icon: esFavoritoSticker ? "mdi:star" : "mdi:star-outline",
      label: esFavoritoSticker ? "Quitar de favoritos" : "Añadir a favoritos",
      onClick: onFavorito,
    });
  }
  items.push({
    icon: "mdi:trash-can-outline",
    label: "Eliminar del CRM",
    onClick: onEliminar,
    danger: true,
  });

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-99999 w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800"
      style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-theme-sm transition hover:bg-gray-50 dark:hover:bg-white/5 ${
            item.danger ? "text-error-500" : "text-gray-700 dark:text-gray-200"
          }`}
        >
          <Icon name={item.icon} size={17} />
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

/** El menú del "+" del composer — vive en el footer fijo, no en la lista con
 * scroll, así que un simple `absolute` (sin portal) alcanza: no hay ningún
 * ancestro con overflow recortando el popover. Abre hacia ARRIBA
 * (`bottom-full`), no hacia abajo como el `Dropdown` genérico del proyecto,
 * porque el botón vive pegado al borde inferior de la pantalla. */
function MenuAdjuntar({
  abierto,
  onCerrar,
  onArchivo,
  onUbicacion,
  onContacto,
  onInteractivo,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onArchivo: () => void;
  onUbicacion: () => void;
  onContacto: () => void;
  onInteractivo: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onClickFuera(e: Event) {
      if (panelRef.current?.contains(e.target as Node)) return;
      onCerrar();
    }
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("touchstart", onClickFuera, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("touchstart", onClickFuera);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const opciones = [
    { icon: "mdi:file-document-outline", label: "Documento o archivo", onClick: onArchivo },
    { icon: "mdi:map-marker-outline", label: "Ubicación", onClick: onUbicacion },
    { icon: "mdi:account-outline", label: "Contacto", onClick: onContacto },
    { icon: "mdi:gesture-tap-button", label: "Mensaje interactivo", onClick: onInteractivo },
  ];

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 z-30 mb-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {opciones.map((opcion) => (
        <button
          key={opcion.label}
          type="button"
          onClick={opcion.onClick}
          className="flex min-h-11 w-full items-center gap-2.5 px-3 py-3 text-left text-theme-sm text-gray-700 transition hover:bg-gray-50 active:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
        >
          <Icon name={opcion.icon} size={18} />
          {opcion.label}
        </button>
      ))}
    </div>
  );
}

function Burbuja({
  mensaje,
  conversacionId,
  nombreContacto,
  animarEntrada,
  onResponder,
  onReenviar,
  onEliminar,
  onSeleccionarParaReenvio,
  modoSeleccion,
  seleccionado,
  onToggleSeleccion,
}: {
  mensaje: Mensaje;
  conversacionId: string;
  nombreContacto: string;
  animarEntrada?: boolean;
  onResponder: (mensaje: Mensaje) => void;
  onReenviar: (mensaje: Mensaje) => void;
  onEliminar: (mensaje: Mensaje) => void;
  onSeleccionarParaReenvio?: (mensaje: Mensaje) => void;
  modoSeleccion?: boolean;
  seleccionado?: boolean;
  onToggleSeleccion?: () => void;
}) {
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esFavoritoSticker, setEsFavoritoSticker] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const esSaliente = mensaje.direccion === "saliente";
  const eliminado = mensaje.estadoEntrega === "eliminado";
  const tieneReaccion = Boolean(mensaje.reaccionAgente || mensaje.reaccionCliente);
  const puedeFavorito = !eliminado && mensaje.tipo === "sticker" && mensaje.tieneMedia;

  useEffect(() => {
    if (!puedeFavorito) {
      setEsFavoritoSticker(false);
      return;
    }
    let cancelado = false;
    void esFavorito(mensaje.id).then((v) => {
      if (!cancelado) setEsFavoritoSticker(v);
    });
    return () => {
      cancelado = true;
    };
  }, [puedeFavorito, mensaje.id]);

  const reaccionar = useAppMutation({
    mutationFn: (emoji: string) => enviarReaccionAction(conversacionId, mensaje.id, emoji),
    invalidateKeys: [queryKeys.whatsappChat(conversacionId)],
    silent: true,
  });

  function textoParaCopiar(): string {
    return (
      mensaje.texto ??
      mensaje.mediaCaption ??
      resumenCitado({
        texto: mensaje.texto,
        mediaCaption: mensaje.mediaCaption,
        tieneMedia: mensaje.tieneMedia,
        tipo: mensaje.tipo,
      })
    );
  }

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => {
        setMenuAbierto(false);
        setSelectorAbierto((v) => !v);
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full text-gray-400 transition hover:bg-gray-100 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-white/10"
      aria-label="Reaccionar"
      title="Reaccionar"
    >
      <Icon name="mdi:emoticon-outline" size={17} />
    </button>
  );

  const chevron = (
    <button
      ref={chevronRef}
      type="button"
      onClick={() => {
        setSelectorAbierto(false);
        setMenuAbierto((v) => !v);
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full text-gray-400 transition hover:bg-gray-100 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-white/10"
      aria-label="Más acciones"
      title="Más acciones"
    >
      <Icon name="mdi:chevron-down" size={17} />
    </button>
  );

  // Mismo orden que WhatsApp real: el desplegable pegado al lado de afuera
  // de la burbuja, la carita de reaccionar entre el desplegable y la burbuja.
  const grupoAcciones = !modoSeleccion ? (
    <div className="flex shrink-0 items-center gap-0.5">
      {esSaliente ? (
        <>
          {chevron}
          {trigger}
        </>
      ) : (
        <>
          {trigger}
          {chevron}
        </>
      )}
    </div>
  ) : null;

  const checkboxSeleccion = modoSeleccion ? (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
        seleccionado
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
      }`}
      aria-hidden
    >
      {seleccionado ? <Icon name="mdi:check" size={14} /> : null}
    </span>
  ) : null;

  const esSticker = !eliminado && mensaje.tipo === "sticker" && mensaje.tieneMedia;
  const preferirMenosMovimiento = useReducedMotion();

  return (
    <motion.div
      className={`group flex items-center gap-2 ${esSaliente ? "justify-end" : "justify-start"} ${
        modoSeleccion ? "cursor-pointer" : ""
      }`}
      style={{ transformOrigin: esSaliente ? "bottom right" : "bottom left" }}
      initial={
        animarEntrada && !preferirMenosMovimiento
          ? { opacity: 0, y: 14, scale: 0.88, x: esSaliente ? 18 : -12 }
          : false
      }
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      transition={
        preferirMenosMovimiento
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 28, mass: 0.65 }
      }
      onClick={modoSeleccion ? onToggleSeleccion : undefined}
      role={modoSeleccion ? "checkbox" : undefined}
      aria-checked={modoSeleccion ? Boolean(seleccionado) : undefined}
    >
      {checkboxSeleccion}
      {esSaliente && grupoAcciones}
      <div
        className={`relative max-w-[85%] space-y-1.5 text-theme-sm sm:max-w-[75%] ${
          esSticker
            ? "px-1 py-1"
            : `rounded-2xl px-4 py-2.5 ${
                esSaliente
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
              }`
        } ${tieneReaccion || reaccionar.isPending ? "mb-2.5" : ""} ${
          modoSeleccion && seleccionado ? "ring-2 ring-brand-400/70" : ""
        }`}
      >
        {eliminado ? (
          <p className="flex items-center gap-1.5 italic opacity-70">
            <Icon name="mdi:cancel" size={16} />
            Este mensaje fue eliminado
          </p>
        ) : (
          <>
        {mensaje.tipo === "template" && mensaje.plantillaNombre ? (
          <p className="flex items-center gap-1 text-theme-xs opacity-80">
            <Icon name="mdi:script-text-outline" size={14} />
            Plantilla: {mensaje.plantillaNombre}
          </p>
        ) : null}
        {(mensaje.tipo === "button_reply" || mensaje.tipo === "list_reply") && (
          <p className="flex items-center gap-1 text-theme-xs opacity-80">
            <Icon name={mensaje.tipo === "button_reply" ? "mdi:gesture-tap-button" : "mdi:format-list-bulleted"} size={14} />
            {mensaje.tipo === "button_reply" ? "Tocó un botón" : "Eligió de la lista"}
          </p>
        )}
        {mensaje.respondeA && (
          <div
            className={`rounded-md border-l-4 px-2 py-1 text-theme-xs ${
              esSaliente ? "border-white/50 bg-white/10" : "border-brand-500 bg-black/5 dark:bg-white/5"
            }`}
          >
            <p className={`font-medium ${esSaliente ? "text-white/90" : "text-brand-500"}`}>
              {mensaje.respondeA.direccion === "saliente" ? "Tú" : nombreContacto}
            </p>
            <p className={`truncate ${esSaliente ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
              {resumenCitado(mensaje.respondeA)}
            </p>
          </div>
        )}
        <ContenidoMedia mensaje={mensaje} conversacionId={conversacionId} />
        {mensaje.ubicacion && <ContenidoUbicacion ubicacion={mensaje.ubicacion} />}
        {mensaje.contactos && mensaje.contactos.length > 0 && (
          <ContenidoContactos contactos={mensaje.contactos} />
        )}
        {(mensaje.texto || mensaje.mediaCaption) && (
          <p className="whitespace-pre-wrap break-words">{mensaje.texto ?? mensaje.mediaCaption}</p>
        )}
        {mensaje.interactivo && <ContenidoInteractivo interactivo={mensaje.interactivo} />}
        {!mensaje.tieneMedia &&
          !TIPOS_MEDIA.has(mensaje.tipo) &&
          !mensaje.texto &&
          !mensaje.ubicacion &&
          !mensaje.contactos?.length &&
          !mensaje.interactivo && <p className="whitespace-pre-wrap break-words opacity-70">(sin texto)</p>}
          </>
        )}
        <div
          className={`flex items-center justify-end gap-1 text-theme-xs ${
            esSticker ? "text-gray-500 dark:text-gray-400" : "opacity-70"
          }`}
        >
          {!eliminado && mensaje.fechaEdicion && (
            <span title={`Editado ${formatearHora(mensaje.fechaEdicion)}`}>editado</span>
          )}
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

        {!eliminado && (tieneReaccion || reaccionar.isPending) && (
          <div className={`absolute -bottom-2.5 flex items-center gap-0.5 ${esSaliente ? "right-2" : "left-2"}`}>
            {mensaje.reaccionCliente && (
              <span className="flex h-5 items-center rounded-full border border-gray-100 bg-white px-1 text-xs shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
                {mensaje.reaccionCliente}
              </span>
            )}
            {reaccionar.isPending ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-100 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
                <Spinner size={11} />
              </span>
            ) : (
              mensaje.reaccionAgente && (
                <button
                  type="button"
                  onClick={() => reaccionar.mutate("")}
                  title="Sacar tu reacción"
                  className="flex h-5 items-center rounded-full border border-gray-100 bg-white px-1 text-xs shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  {mensaje.reaccionAgente}
                </button>
              )
            )}
          </div>
        )}

        {!eliminado && selectorAbierto && !modoSeleccion && (
          <SelectorReacciones
            anchorRef={triggerRef}
            onElegir={(emoji) => {
              reaccionar.mutate(emoji === mensaje.reaccionAgente ? "" : emoji);
              setSelectorAbierto(false);
            }}
            onCerrar={() => setSelectorAbierto(false)}
          />
        )}

        {menuAbierto && !modoSeleccion && (
          <MenuAcciones
            anchorRef={chevronRef}
            onResponder={() => {
              onResponder(mensaje);
              setMenuAbierto(false);
            }}
            onCopiar={() => {
              void navigator.clipboard.writeText(textoParaCopiar());
              setMenuAbierto(false);
            }}
            onReenviar={() => {
              onReenviar(mensaje);
              setMenuAbierto(false);
            }}
            onSeleccionar={() => {
              onSeleccionarParaReenvio?.(mensaje);
              setMenuAbierto(false);
            }}
            esFavoritoSticker={esFavoritoSticker}
            onFavorito={
              puedeFavorito
                ? () => {
                    void (async () => {
                      try {
                        if (esFavoritoSticker) {
                          await quitarFavorito(mensaje.id);
                          setEsFavoritoSticker(false);
                        } else {
                          await favoritoDesdeMensaje({
                            mensajeId: mensaje.id,
                            conversacionId,
                            nombre: "Sticker",
                          });
                          setEsFavoritoSticker(true);
                        }
                        window.dispatchEvent(new Event("crm-sticker-favoritos-changed"));
                      } catch {
                        // Silencioso: el menú ya se cierra; el usuario puede reintentar.
                      }
                      setMenuAbierto(false);
                    })();
                  }
                : undefined
            }
            onEliminar={() => {
              onEliminar(mensaje);
              setMenuAbierto(false);
            }}
            onCerrar={() => setMenuAbierto(false)}
          />
        )}
      </div>
      {!esSaliente && grupoAcciones}
    </motion.div>
  );
}

export default function ChatDetailView({
  id,
  crmHabilitado = false,
}: {
  id: string;
  crmHabilitado?: boolean;
}) {
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const textoRef = useRef("");
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");
  const [valoresVariables, setValoresVariables] = useState<Record<string, string>>({});
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [respondiendoA, setRespondiendoA] = useState<Mensaje | null>(null);
  const [modoSeleccionReenvio, setModoSeleccionReenvio] = useState(false);
  const [idsReenvio, setIdsReenvio] = useState<string[]>([]);
  const [modalReenvioAbierto, setModalReenvioAbierto] = useState(false);
  const [destinoReenvio, setDestinoReenvio] = useState("");
  const [menuAdjuntarAbierto, setMenuAdjuntarAbierto] = useState(false);
  const [pickerEmojiAbierto, setPickerEmojiAbierto] = useState(false);
  const [idsAnimarEntrada, setIdsAnimarEntrada] = useState<Set<string>>(() => new Set());
  const [pulsarEnviar, setPulsarEnviar] = useState(false);
  const [grabandoVoz, setGrabandoVoz] = useState(false);
  const [segundosVoz, setSegundosVoz] = useState(0);
  const grabadorVozRef = useRef<GrabadorNotaVoz | null>(null);
  const timerVozRef = useRef<number | null>(null);
  const mensajesVistosRef = useRef<Set<string>>(new Set());
  const conversacionAnimRef = useRef<string | null>(null);
  const [modalUbicacionAbierto, setModalUbicacionAbierto] = useState(false);
  const [ubicLat, setUbicLat] = useState("");
  const [ubicLng, setUbicLng] = useState("");
  const [ubicNombre, setUbicNombre] = useState("");
  const [ubicDireccion, setUbicDireccion] = useState("");
  const [ubicGeoError, setUbicGeoError] = useState<string | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [modalContactoAbierto, setModalContactoAbierto] = useState(false);
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [contactoOrganizacion, setContactoOrganizacion] = useState("");
  const [modalInteractivoAbierto, setModalInteractivoAbierto] = useState(false);
  const [interSubtipo, setInterSubtipo] = useState<Interactivo["subtipo"]>("button");
  const [interCuerpo, setInterCuerpo] = useState("");
  const [interPie, setInterPie] = useState("");
  const [interBotones, setInterBotones] = useState<string[]>([""]);
  const [interBotonLista, setInterBotonLista] = useState("");
  const [interFilas, setInterFilas] = useState<{ titulo: string; descripcion: string }[]>([
    { titulo: "", descripcion: "" },
  ]);
  const [interTextoBoton, setInterTextoBoton] = useState("");
  const [interUrl, setInterUrl] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);
  const contenidoListaRef = useRef<HTMLDivElement>(null);
  /** Si el usuario está cerca del fondo, seguimos pegando el scroll al último mensaje. */
  const pegarAlFondoRef = useRef(true);
  const conversacionScrollRef = useRef<string | null>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const inputStickerRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const botonEmojiRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const ultimoEscribiendoRef = useRef(0);

  function actualizarTexto(valor: string) {
    textoRef.current = valor;
    setTexto(valor);
    // Best-effort: si falla (sin conexión, rate limit de Meta) no debe
    // interrumpir para nada al usuario mientras escribe — por eso no se
    // espera ni se muestra ningún error acá.
    if (valor.trim() && Date.now() - ultimoEscribiendoRef.current > THROTTLE_ESCRIBIENDO_MS) {
      ultimoEscribiendoRef.current = Date.now();
      notificarEscribiendoAction(id).catch(() => undefined);
    }
    // Vacío = sin borrador. Guardamos de inmediato para que al cambiar de
    // chat el cleanup no vuelva a persistir texto ya borrado.
    setBorrador(id, valor);
  }

  useEffect(() => {
    const borrador = getBorrador(id) ?? "";
    textoRef.current = borrador;
    setTexto(borrador);
    setRespondiendoA(null);
    setArchivo(null);
    setErrorArchivo(null);
    setMenuAdjuntarAbierto(false);
    setPickerEmojiAbierto(false);
    return () => {
      const restante = textoRef.current.trim();
      if (restante) {
        setBorrador(id, restante);
      } else {
        clearBorrador(id);
      }
    };
  }, [id]);

  function insertarEmojiEnTexto(emoji: string) {
    const el = textareaRef.current;
    const actual = textoRef.current;
    const inicio = el?.selectionStart ?? actual.length;
    const fin = el?.selectionEnd ?? actual.length;
    const siguiente = actual.slice(0, inicio) + emoji + actual.slice(fin);
    actualizarTexto(siguiente);
    // Restaurar el cursor justo después del emoji insertado.
    requestAnimationFrame(() => {
      const cursor = inicio + emoji.length;
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  }

  const chatQuery = useQuery<ConversacionDetalle>({
    queryKey: queryKeys.whatsappChat(id),
    queryFn: () => getChat(id),
    refetchInterval: INTERVALO_REFRESCO_MS,
  });

  // Al abrir el chat el backend pone noLeidos=0 — reflejamos ya en la lista
  // para que el badge azul desaparezca sin esperar el poll de 15s.
  useEffect(() => {
    if (!chatQuery.isSuccess) return;
    queryClient.setQueryData(
      queryKeys.whatsappChats,
      (prev: ConversacionResumen[] | undefined) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((c) => (c.id === id ? { ...c, noLeidos: 0 } : c));
      },
    );
    void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChatsUnreadCount });
  }, [chatQuery.isSuccess, id, queryClient]);

  const dentroDeVentana = estaDentroDeVentana(chatQuery.data?.ventanaExpiraEn);

  const templatesQuery = useQuery<PlantillaWhatsApp[]>({
    queryKey: queryKeys.whatsappTemplates,
    queryFn: getTemplates,
    enabled: !dentroDeVentana,
  });

  const plantilla = templatesQuery.data?.find((p: PlantillaWhatsApp) => p.nombre === plantillaSeleccionada);
  const variables = extraerVariables(plantilla?.cuerpoTexto);
  const parametrosCompletos = variables.every((nombre) => (valoresVariables[nombre] ?? "").trim().length > 0);

  const enviar = useAppMutation({
    mutationFn: async () => {
      if (dentroDeVentana) {
        // El "responder a" solo aplica al texto de sesión — Meta no admite
        // context en el envío de plantillas.
        await enviarMensajeAction(id, { texto, respondeAMensajeId: respondiendoA?.id });
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
    // Loading solo en el botón enviar — no el overlay global "Procesando…".
    silent: true,
  });

  const enviarArchivo = useAppMutation({
    mutationFn: async () => {
      if (!archivo) return;
      const formData = new FormData();
      formData.append("archivo", archivo);
      if (texto.trim()) formData.append("caption", texto.trim());
      if (respondiendoA) formData.append("respondeAMensajeId", respondiendoA.id);
      await enviarMediaAction(id, formData);
    },
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
    silent: true,
  });

  /** Envío inmediato de GIF/sticker/nota de voz (sin pasar por el draft del composer). */
  const enviarMediaDirecto = useAppMutation({
    mutationFn: async (input: File | { file: File; esVoz?: boolean }) => {
      const file = input instanceof File ? input : input.file;
      const esVoz = input instanceof File ? false : Boolean(input.esVoz);
      const formData = new FormData();
      formData.append("archivo", file);
      if (respondiendoA) formData.append("respondeAMensajeId", respondiendoA.id);
      if (esVoz) formData.append("esVoz", "1");
      await enviarMediaAction(id, formData);
    },
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
    silent: true,
  });

  function detenerTimerVoz() {
    if (timerVozRef.current !== null) {
      window.clearInterval(timerVozRef.current);
      timerVozRef.current = null;
    }
  }

  async function iniciarGrabacionVoz() {
    setErrorArchivo(null);
    setPickerEmojiAbierto(false);
    setMenuAdjuntarAbierto(false);
    desbloquearAudioChat();
    try {
      const grabador = new GrabadorNotaVoz();
      grabadorVozRef.current = grabador;
      await grabador.iniciar();
      setGrabandoVoz(true);
      setSegundosVoz(0);
      detenerTimerVoz();
      timerVozRef.current = window.setInterval(() => {
        setSegundosVoz((s) => s + 1);
      }, 1000);
    } catch {
      grabadorVozRef.current = null;
      setErrorArchivo("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  }

  function cancelarGrabacionVoz() {
    grabadorVozRef.current?.cancelar();
    grabadorVozRef.current = null;
    detenerTimerVoz();
    setGrabandoVoz(false);
    setSegundosVoz(0);
  }

  async function enviarGrabacionVoz() {
    const grabador = grabadorVozRef.current;
    if (!grabador) return;
    setErrorArchivo(null);
    try {
      const resultado = await grabador.detener();
      grabadorVozRef.current = null;
      detenerTimerVoz();
      setGrabandoVoz(false);
      setSegundosVoz(0);
      const error = validarArchivo(resultado.file);
      if (error) {
        setErrorArchivo(error);
        return;
      }
      await enviarMediaDirecto.mutateAsync({ file: resultado.file, esVoz: resultado.esVoz });
      feedbackMensajeEnviado();
      setPulsarEnviar(true);
      window.setTimeout(() => setPulsarEnviar(false), 220);
      setRespondiendoA(null);
    } catch (e) {
      grabadorVozRef.current = null;
      detenerTimerVoz();
      setGrabandoVoz(false);
      setSegundosVoz(0);
      setErrorArchivo(e instanceof Error ? e.message : "No se pudo enviar la nota de voz");
    }
  }

  useEffect(() => {
    return () => {
      grabadorVozRef.current?.cancelar();
      detenerTimerVoz();
    };
  }, []);

  async function enviarGifElegido(gif: Gif) {
    setErrorArchivo(null);
    const fuente = resolverFuenteGif(gif);
    if (!fuente) {
      setErrorArchivo(
        "Este GIF no trae MP4. WhatsApp Cloud API no admite GIF nativo; elige otro.",
      );
      return;
    }
    try {
      const file = await descargarComoArchivo(fuente.url, fuente.nombre, fuente.mime);
      const error = validarArchivo(file);
      if (error) {
        setErrorArchivo(error);
        return;
      }
      await enviarMediaDirecto.mutateAsync(file);
      feedbackMensajeEnviado();
      setPulsarEnviar(true);
      window.setTimeout(() => setPulsarEnviar(false), 220);
      setRespondiendoA(null);
    } catch (e) {
      setErrorArchivo(e instanceof Error ? e.message : "No se pudo enviar el GIF");
    }
  }

  async function enviarStickerPack(sticker: StickerPackItem) {
    setErrorArchivo(null);
    try {
      const file = sticker.blob
        ? new File([sticker.blob], `${sticker.id}.webp`, { type: "image/webp" })
        : await descargarComoArchivo(sticker.src, `${sticker.id}.webp`, "image/webp");
      const error = validarArchivo(file);
      if (error) {
        setErrorArchivo(error);
        return;
      }
      await enviarMediaDirecto.mutateAsync(file);
      feedbackMensajeEnviado();
      setPulsarEnviar(true);
      window.setTimeout(() => setPulsarEnviar(false), 220);
      setRespondiendoA(null);
    } catch (e) {
      setErrorArchivo(e instanceof Error ? e.message : "No se pudo enviar el sticker");
    }
  }

  const chatsQuery = useQuery<ConversacionResumen[]>({
    queryKey: queryKeys.whatsappChats,
    queryFn: getChats,
    enabled: modalReenvioAbierto,
  });

  const bloquear = useAppMutation({
    mutationFn: (bloquearContacto: boolean) => bloquearContactoAction(id, bloquearContacto),
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  const eliminarMensaje = useAppMutation({
    mutationFn: (mensajeId: string) => eliminarMensajeAction(id, mensajeId),
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  function ordenarIdsPorChat(ids: string[]): string[] {
    const mensajes: Mensaje[] = chatQuery.data?.mensajes ?? [];
    const ordenChat = new Map<string, number>();
    mensajes.forEach((m, i) => ordenChat.set(m.id, i));
    return [...ids].sort((a, b) => (ordenChat.get(a) ?? 0) - (ordenChat.get(b) ?? 0));
  }

  const reenviar = useAppMutation({
    mutationFn: () => {
      if (!destinoReenvio || idsReenvio.length === 0) {
        return Promise.resolve({ enviados: 0, fallidos: [] as { mensajeId: string; error: string }[] });
      }
      return reenviarMensajesLoteAction(id, ordenarIdsPorChat(idsReenvio), destinoReenvio);
    },
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  function salirModoSeleccionReenvio() {
    setModoSeleccionReenvio(false);
    setIdsReenvio([]);
  }

  function cerrarModalReenvio() {
    setModalReenvioAbierto(false);
    setDestinoReenvio("");
    if (!modoSeleccionReenvio) setIdsReenvio([]);
  }

  function abrirModalReenvio(ids?: string[]) {
    const seleccion = ids ?? idsReenvio;
    if (seleccion.length === 0) return;
    setIdsReenvio(ordenarIdsPorChat(seleccion));
    setDestinoReenvio("");
    setModalReenvioAbierto(true);
  }

  function toggleSeleccionReenvio(mensajeId: string) {
    setIdsReenvio((prev) => {
      if (prev.includes(mensajeId)) return prev.filter((idMsg) => idMsg !== mensajeId);
      if (prev.length >= MAX_MENSAJES_REENVIAR) {
        toast.error(`Máximo ${MAX_MENSAJES_REENVIAR} mensajes`);
        return prev;
      }
      return [...prev, mensajeId];
    });
  }

  function cerrarModalUbicacion() {
    setModalUbicacionAbierto(false);
    setUbicLat("");
    setUbicLng("");
    setUbicNombre("");
    setUbicDireccion("");
    setUbicGeoError(null);
  }

  function usarUbicacionActual() {
    if (!navigator.geolocation) {
      setUbicGeoError("Tu navegador no soporta geolocalización");
      return;
    }
    setObteniendoUbicacion(true);
    setUbicGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicLat(String(pos.coords.latitude));
        setUbicLng(String(pos.coords.longitude));
        setObteniendoUbicacion(false);
      },
      () => {
        setUbicGeoError("No se pudo obtener tu ubicación — revisa los permisos del navegador");
        setObteniendoUbicacion(false);
      },
    );
  }

  const enviarUbicacion = useAppMutation({
    mutationFn: () =>
      enviarUbicacionAction(id, {
        latitud: Number(ubicLat),
        longitud: Number(ubicLng),
        nombre: ubicNombre.trim() || undefined,
        direccion: ubicDireccion.trim() || undefined,
        respondeAMensajeId: respondiendoA?.id,
      }),
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  function cerrarModalContacto() {
    setModalContactoAbierto(false);
    setContactoNombre("");
    setContactoTelefono("");
    setContactoOrganizacion("");
  }

  const enviarContacto = useAppMutation({
    mutationFn: () =>
      enviarContactoAction(id, {
        contactos: [
          {
            nombre: contactoNombre.trim(),
            telefonos: [{ numero: contactoTelefono.trim() }],
            organizacion: contactoOrganizacion.trim() || undefined,
          },
        ],
        respondeAMensajeId: respondiendoA?.id,
      }),
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  function cerrarModalInteractivo() {
    setModalInteractivoAbierto(false);
    setInterSubtipo("button");
    setInterCuerpo("");
    setInterPie("");
    setInterBotones([""]);
    setInterBotonLista("");
    setInterFilas([{ titulo: "", descripcion: "" }]);
    setInterTextoBoton("");
    setInterUrl("");
  }

  const interactivoValido =
    interCuerpo.trim().length > 0 &&
    (interSubtipo === "button"
      ? interBotones.some((t) => t.trim())
      : interSubtipo === "list"
        ? interBotonLista.trim().length > 0 && interFilas.some((f) => f.titulo.trim())
        : interSubtipo === "cta_url"
          ? interTextoBoton.trim().length > 0 && interUrl.trim().length > 0
          : true);

  const enviarInteractivo = useAppMutation({
    mutationFn: () => {
      const base = {
        subtipo: interSubtipo,
        cuerpo: interCuerpo.trim(),
        pie: interPie.trim() || undefined,
        respondeAMensajeId: respondiendoA?.id,
      };
      if (interSubtipo === "button") {
        return enviarInteractivoAction(id, {
          ...base,
          botones: interBotones
            .filter((t) => t.trim())
            .map((titulo, i) => ({ id: `boton_${i + 1}`, titulo: titulo.trim() })),
        });
      }
      if (interSubtipo === "list") {
        return enviarInteractivoAction(id, {
          ...base,
          botonLista: interBotonLista.trim(),
          secciones: [
            {
              filas: interFilas
                .filter((f) => f.titulo.trim())
                .map((f, i) => ({
                  id: `fila_${i + 1}`,
                  titulo: f.titulo.trim(),
                  descripcion: f.descripcion.trim() || undefined,
                })),
            },
          ],
        });
      }
      if (interSubtipo === "cta_url") {
        return enviarInteractivoAction(id, {
          ...base,
          textoBoton: interTextoBoton.trim(),
          url: interUrl.trim(),
        });
      }
      return enviarInteractivoAction(id, base);
    },
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  function scrollListaAlFondo() {
    const lista = listaRef.current;
    if (!lista) return;
    // Asignar scrollTop (no scrollIntoView): evita desplazar el layout
    // padre y no deja animaciones smooth a medias cuando crece el contenido.
    lista.scrollTop = lista.scrollHeight;
  }

  function actualizarPegarAlFondo() {
    const lista = listaRef.current;
    if (!lista) return;
    const distancia = lista.scrollHeight - lista.scrollTop - lista.clientHeight;
    pegarAlFondoRef.current = distancia <= 96;
  }

  // Al abrir el chat o llegar mensajes nuevos: ir al fondo antes de pintar.
  // Antes se usaba scrollIntoView({ behavior: "smooth" }), que podía
  // scrollear ancestros y quedarse "atascado" cuando imágenes/audio
  // cambiaban la altura después del primer paint.
  useLayoutEffect(() => {
    const mensajes = chatQuery.data?.mensajes;
    if (!mensajes) return;

    const cambioConversacion = conversacionScrollRef.current !== id;
    if (cambioConversacion) {
      conversacionScrollRef.current = id;
      pegarAlFondoRef.current = true;
      scrollListaAlFondo();
      return;
    }

    if (pegarAlFondoRef.current) {
      scrollListaAlFondo();
    }
  }, [chatQuery.data?.mensajes, id]);

  // Cuando carga media (img/audio/video) el contenido crece: re-pegar al
  // fondo solo si el usuario no se fue a leer historial más arriba.
  useEffect(() => {
    const contenido = contenidoListaRef.current;
    if (!contenido || !chatQuery.isSuccess) return;

    const ro = new ResizeObserver(() => {
      if (pegarAlFondoRef.current) {
        scrollListaAlFondo();
      }
    });
    ro.observe(contenido);
    return () => ro.disconnect();
  }, [id, chatQuery.isSuccess]);

  // Animar solo mensajes nuevos (no el historial al abrir el chat).
  useEffect(() => {
    const mensajes = chatQuery.data?.mensajes;
    if (!mensajes) return;

    if (conversacionAnimRef.current !== id) {
      conversacionAnimRef.current = id;
      mensajesVistosRef.current = new Set(mensajes.map((m: Mensaje) => m.id));
      setIdsAnimarEntrada(new Set());
      return;
    }

    const nuevos = mensajes.filter((m: Mensaje) => !mensajesVistosRef.current.has(m.id));
    if (nuevos.length === 0) return;

    for (const m of nuevos) mensajesVistosRef.current.add(m.id);
    setIdsAnimarEntrada((prev) => {
      const next = new Set(prev);
      for (const m of nuevos) next.add(m.id);
      return next;
    });

    const timer = window.setTimeout(() => {
      setIdsAnimarEntrada((prev) => {
        const next = new Set(prev);
        for (const m of nuevos) next.delete(m.id);
        return next;
      });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [chatQuery.data?.mensajes, id]);

  function alEnviarConFeedback(onDone?: () => void) {
    return () => {
      feedbackMensajeEnviado();
      setPulsarEnviar(true);
      window.setTimeout(() => setPulsarEnviar(false), 220);
      onDone?.();
    };
  }

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChats });
    };
  }, [queryClient]);

  if (chatQuery.isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col" role="status" aria-label="Cargando conversación">
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <Skeleton className="ml-auto h-12 w-[55%] rounded-2xl" />
          <Skeleton className="h-16 w-[65%] rounded-2xl" />
          <Skeleton className="ml-auto h-10 w-[40%] rounded-2xl" />
          <Skeleton className="h-14 w-[70%] rounded-2xl" />
        </div>
        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <Skeleton className="h-11 w-full rounded-3xl" />
        </div>
      </div>
    );
  }
  if (chatQuery.isError) {
    return <QueryError error={chatQuery.error} onRetry={() => void chatQuery.refetch()} />;
  }
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-4">
        <Link
          href="/chats"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 md:hidden dark:hover:bg-white/5"
          aria-label="Volver a chats"
        >
          <Icon name="mdi:arrow-left" size={22} />
        </Link>
        <Avatar name={nombre} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{nombre}</p>
          {chat.bloqueado ? (
            <p className="text-theme-xs text-error-500">+{chat.waId} · Bloqueado</p>
          ) : chat.lead ? (
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">+{chat.waId} · Lead vinculado</p>
          ) : (
            <p className="text-theme-xs text-warning-500">+{chat.waId} · Sin lead vinculado</p>
          )}
          {crmHabilitado && chat.lead ? (
            <div className="mt-1 min-w-0">
              <ChatLeadInmuebleChip
                leadId={chat.lead.id}
                conversacionId={id}
                inmuebleInteres={chat.lead.inmuebleInteres}
              />
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={bloquear.isPending}
          onClick={() => {
            const accion = chat.bloqueado ? "desbloquear" : "bloquear";
            if (window.confirm(`¿Seguro que quieres ${accion} a este contacto en WhatsApp?`)) {
              bloquear.mutate(!chat.bloqueado);
            }
          }}
        >
          {chat.bloqueado ? "Desbloquear" : "Bloquear"}
        </Button>
      </div>

      <div
        ref={listaRef}
        onScroll={actualizarPegarAlFondo}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch] sm:px-5 sm:py-4"
      >
        <div ref={contenidoListaRef} className="space-y-3">
          {chat.mensajes.length === 0 ? (
            <p className="text-center text-theme-sm text-gray-500 dark:text-gray-400">
              Todavía no hay mensajes en esta conversación.
            </p>
          ) : (
            chat.mensajes.map((mensaje: Mensaje) => (
              <Burbuja
                key={mensaje.id}
                mensaje={mensaje}
                conversacionId={id}
                nombreContacto={nombre}
                animarEntrada={idsAnimarEntrada.has(mensaje.id)}
                modoSeleccion={modoSeleccionReenvio}
                seleccionado={idsReenvio.includes(mensaje.id)}
                onToggleSeleccion={() => toggleSeleccionReenvio(mensaje.id)}
                onResponder={setRespondiendoA}
                onReenviar={(m) => {
                  abrirModalReenvio([m.id]);
                }}
                onSeleccionarParaReenvio={(m) => {
                  setModoSeleccionReenvio(true);
                  setIdsReenvio([m.id]);
                }}
                onEliminar={(m) => {
                  if (
                    window.confirm(
                      "¿Eliminar este mensaje del CRM?\n\nNota: Meta Cloud API no permite borrar el mensaje en el WhatsApp del contacto. Si lo borras desde la app Business del celular, sí se sincroniza aquí.",
                    )
                  ) {
                    eliminarMensaje.mutate(m.id);
                  }
                }}
              />
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-800 sm:p-4">
        {modoSeleccionReenvio && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
            <p className="text-theme-sm text-gray-700 dark:text-gray-200">
              {idsReenvio.length} seleccionado{idsReenvio.length === 1 ? "" : "s"} (máx.{" "}
              {MAX_MENSAJES_REENVIAR})
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={salirModoSeleccionReenvio}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={idsReenvio.length === 0}
                onClick={() => abrirModalReenvio()}
              >
                Reenviar
              </Button>
            </div>
          </div>
        )}
        {chat.bloqueado ? (
          <p className="flex items-center gap-1.5 text-theme-sm text-error-500">
            <Icon name="mdi:block-helper" size={16} />
            Contacto bloqueado — desbloquéalo para volver a escribir.
          </p>
        ) : dentroDeVentana ? (
          <form
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              if (archivo) {
                enviarArchivo.mutate(undefined, {
                  onSuccess: alEnviarConFeedback(() => {
                    setArchivo(null);
                    textoRef.current = "";
                    setTexto("");
                    clearBorrador(id);
                    setRespondiendoA(null);
                    setPickerEmojiAbierto(false);
                    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
                  }),
                });
              } else if (texto.trim()) {
                enviar.mutate(undefined, {
                  onSuccess: alEnviarConFeedback(() => {
                    textoRef.current = "";
                    setTexto("");
                    clearBorrador(id);
                    setRespondiendoA(null);
                    setPickerEmojiAbierto(false);
                  }),
                });
              }
            }}
            className="space-y-2"
          >
            {respondiendoA && (
              <div className="flex items-center gap-2 rounded-lg border-l-4 border-brand-500 bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
                <div className="min-w-0 flex-1">
                  <p className="text-theme-xs font-medium text-brand-500">
                    {respondiendoA.direccion === "saliente" ? "Tú" : nombre}
                  </p>
                  <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                    {resumenCitado(respondiendoA)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRespondiendoA(null)}
                  aria-label="Cancelar respuesta"
                  className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Icon name="mdi:close" size={16} />
                </button>
              </div>
            )}
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
            {grabandoVoz ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelarGrabacionVoz}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-error-500 transition hover:bg-error-50 dark:hover:bg-error-500/10"
                  aria-label="Cancelar nota de voz"
                >
                  <Icon name="mdi:trash-can-outline" size={22} />
                </button>
                <div className="flex min-h-11 flex-1 items-center gap-2 rounded-3xl border border-error-200 bg-error-50/60 px-4 dark:border-error-500/30 dark:bg-error-500/10">
                  <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-error-500" />
                  <span className="text-theme-sm font-medium tabular-nums text-error-600 dark:text-error-400">
                    {String(Math.floor(segundosVoz / 60)).padStart(2, "0")}:
                    {String(segundosVoz % 60).padStart(2, "0")}
                  </span>
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400">Grabando…</span>
                </div>
                <motion.button
                  type="button"
                  onClick={() => void enviarGrabacionVoz()}
                  disabled={enviarMediaDirecto.isPending}
                  aria-label="Enviar nota de voz"
                  whileTap={{ scale: 0.88 }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                  {enviarMediaDirecto.isPending ? (
                    <Spinner size={18} />
                  ) : (
                    <Icon name="mdi:send" size={19} className="translate-x-px" />
                  )}
                </motion.button>
              </div>
            ) : (
            <div className="flex items-end gap-2">
              <input
                ref={inputArchivoRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,video/mp4,video/3gpp,audio/aac,audio/mp4,audio/mpeg,audio/amr,audio/ogg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => elegirArchivo(e.target.files?.[0])}
              />
              <input
                ref={inputStickerRef}
                type="file"
                className="hidden"
                accept="image/webp,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (inputStickerRef.current) inputStickerRef.current.value = "";
                  elegirArchivo(file);
                }}
              />
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPickerEmojiAbierto(false);
                    setMenuAdjuntarAbierto((v) => !v);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                  aria-label="Adjuntar"
                >
                  <Icon name="mdi:plus" size={24} />
                </button>
                <MenuAdjuntar
                  abierto={menuAdjuntarAbierto}
                  onCerrar={() => setMenuAdjuntarAbierto(false)}
                  onArchivo={() => {
                    setMenuAdjuntarAbierto(false);
                    inputArchivoRef.current?.click();
                  }}
                  onUbicacion={() => {
                    setMenuAdjuntarAbierto(false);
                    setModalUbicacionAbierto(true);
                  }}
                  onContacto={() => {
                    setMenuAdjuntarAbierto(false);
                    setModalContactoAbierto(true);
                  }}
                  onInteractivo={() => {
                    setMenuAdjuntarAbierto(false);
                    setModalInteractivoAbierto(true);
                  }}
                />
              </div>
              <div className="flex flex-1 items-end gap-0.5 rounded-3xl border border-gray-200 bg-white pl-1 pr-1.5 py-1 dark:border-gray-700 dark:bg-gray-900">
                <div className="relative shrink-0">
                  <button
                    ref={botonEmojiRef}
                    type="button"
                    onClick={() => {
                      setMenuAdjuntarAbierto(false);
                      setPickerEmojiAbierto((v) => !v);
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-gray-100 dark:hover:bg-white/5 ${
                      pickerEmojiAbierto
                        ? "text-brand-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                    aria-label="Emojis, GIFs y stickers"
                    aria-expanded={pickerEmojiAbierto}
                  >
                    <Icon name="mdi:emoticon-outline" size={24} />
                  </button>
                  <SelectorComposerMedia
                    abierto={pickerEmojiAbierto}
                    anchorRef={botonEmojiRef}
                    onEmoji={insertarEmojiEnTexto}
                    onGif={(gif) => {
                      void enviarGifElegido(gif);
                    }}
                    onSticker={(sticker) => {
                      void enviarStickerPack(sticker);
                    }}
                    onSubirSticker={() => inputStickerRef.current?.click()}
                    onCerrar={() => setPickerEmojiAbierto(false)}
                  />
                </div>
                <textarea
                  ref={textareaRef}
                  value={texto}
                  onFocus={() => desbloquearAudioChat()}
                  onChange={(event) => actualizarTexto(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  placeholder={archivo ? "Agrega un texto (opcional)…" : "Escribe un mensaje…"}
                  rows={1}
                  enterKeyHint="send"
                  className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-base text-gray-800 outline-none sm:text-theme-sm dark:text-white/90"
                />
              </div>
              {!archivo && !texto.trim() ? (
                <motion.button
                  type="button"
                  onClick={() => void iniciarGrabacionVoz()}
                  disabled={enviarMediaDirecto.isPending}
                  aria-label="Grabar nota de voz"
                  whileTap={{ scale: 0.88 }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300 dark:disabled:bg-brand-500/40"
                >
                  <Icon name="mdi:microphone" size={22} />
                </motion.button>
              ) : (
              <motion.button
                type="submit"
                disabled={
                  (!archivo && !texto.trim()) ||
                  enviar.isPending ||
                  enviarArchivo.isPending ||
                  enviarMediaDirecto.isPending
                }
                aria-label="Enviar mensaje"
                whileTap={{ scale: 0.88 }}
                animate={pulsarEnviar ? { scale: [1, 0.84, 1] } : { scale: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300 dark:disabled:bg-brand-500/40"
              >
                {enviar.isPending || enviarArchivo.isPending || enviarMediaDirecto.isPending ? (
                  <Spinner size={18} />
                ) : (
                  <Icon name="mdi:send" size={19} className="translate-x-px" />
                )}
              </motion.button>
              )}
            </div>
            )}
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
                  options={(templatesQuery.data ?? []).map((t: PlantillaWhatsApp) => ({
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
                      onSuccess: alEnviarConFeedback(() => {
                        setPlantillaSeleccionada("");
                        setValoresVariables({});
                      }),
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
                      onSuccess: alEnviarConFeedback(() => {
                        setPlantillaSeleccionada("");
                        setValoresVariables({});
                      }),
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

      <Modal
        open={modalUbicacionAbierto}
        onClose={cerrarModalUbicacion}
        header={
          <div className="px-5 py-4">
            <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Enviar ubicación
            </h3>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={cerrarModalUbicacion}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              loading={enviarUbicacion.isPending}
              disabled={!ubicLat.trim() || !ubicLng.trim()}
              onClick={() =>
                enviarUbicacion.mutate(undefined, {
                  onSuccess: alEnviarConFeedback(() => {
                    cerrarModalUbicacion();
                    setRespondiendoA(null);
                  }),
                })
              }
            >
              Enviar
            </Button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={obteniendoUbicacion}
            startIcon={<Icon name="mdi:crosshairs-gps" size={16} />}
            onClick={usarUbicacionActual}
          >
            Usar mi ubicación actual
          </Button>
          {ubicGeoError && <p className="text-theme-xs text-error-500">{ubicGeoError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Latitud" value={ubicLat} onChange={(e) => setUbicLat(e.target.value)} />
            <Input placeholder="Longitud" value={ubicLng} onChange={(e) => setUbicLng(e.target.value)} />
          </div>
          <Input
            placeholder="Nombre del lugar (opcional)"
            value={ubicNombre}
            onChange={(e) => setUbicNombre(e.target.value)}
          />
          <Input
            placeholder="Dirección (opcional)"
            value={ubicDireccion}
            onChange={(e) => setUbicDireccion(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={modalContactoAbierto}
        onClose={cerrarModalContacto}
        header={
          <div className="px-5 py-4">
            <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Enviar contacto
            </h3>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={cerrarModalContacto}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              loading={enviarContacto.isPending}
              disabled={!contactoNombre.trim() || !contactoTelefono.trim()}
              onClick={() =>
                enviarContacto.mutate(undefined, {
                  onSuccess: alEnviarConFeedback(() => {
                    cerrarModalContacto();
                    setRespondiendoA(null);
                  }),
                })
              }
            >
              Enviar
            </Button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4">
          <Input
            placeholder="Nombre del contacto"
            value={contactoNombre}
            onChange={(e) => setContactoNombre(e.target.value)}
          />
          <Input
            placeholder="Teléfono (ej. +51987654321)"
            value={contactoTelefono}
            onChange={(e) => setContactoTelefono(e.target.value)}
          />
          <Input
            placeholder="Empresa (opcional)"
            value={contactoOrganizacion}
            onChange={(e) => setContactoOrganizacion(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={modalInteractivoAbierto}
        onClose={cerrarModalInteractivo}
        header={
          <div className="px-5 py-4">
            <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Enviar mensaje interactivo
            </h3>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={cerrarModalInteractivo}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              loading={enviarInteractivo.isPending}
              disabled={!interactivoValido}
              onClick={() =>
                enviarInteractivo.mutate(undefined, {
                  onSuccess: alEnviarConFeedback(() => {
                    cerrarModalInteractivo();
                    setRespondiendoA(null);
                  }),
                })
              }
            >
              Enviar
            </Button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {(
              [
                { valor: "button", icon: "mdi:gesture-tap-button", label: "Botones" },
                { valor: "list", icon: "mdi:format-list-bulleted", label: "Lista" },
                { valor: "cta_url", icon: "mdi:link-variant", label: "Link" },
                { valor: "location_request", icon: "mdi:map-marker-radius-outline", label: "Ubicación" },
              ] as const
            ).map((op) => (
              <button
                key={op.valor}
                type="button"
                onClick={() => setInterSubtipo(op.valor)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-theme-xs transition ${
                  interSubtipo === op.valor
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                <Icon name={op.icon} size={18} />
                {op.label}
              </button>
            ))}
          </div>

          <textarea
            value={interCuerpo}
            onChange={(e) => setInterCuerpo(e.target.value)}
            placeholder="Texto del mensaje"
            rows={3}
            maxLength={1024}
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-800 outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />

          {interSubtipo !== "location_request" && (
            <Input
              placeholder="Pie de página (opcional)"
              value={interPie}
              onChange={(e) => setInterPie(e.target.value)}
            />
          )}

          {interSubtipo === "button" && (
            <div className="space-y-2">
              <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Botones (hasta 3)
              </p>
              {interBotones.map((titulo, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Botón ${i + 1}`}
                    value={titulo}
                    onChange={(e) =>
                      setInterBotones((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))
                    }
                  />
                  {interBotones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInterBotones((prev) => prev.filter((_, j) => j !== i))}
                      className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label="Quitar botón"
                    >
                      <Icon name="mdi:close" size={16} />
                    </button>
                  )}
                </div>
              ))}
              {interBotones.length < 3 && (
                <button
                  type="button"
                  onClick={() => setInterBotones((prev) => [...prev, ""])}
                  className="flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  <Icon name="mdi:plus" size={14} />
                  Agregar botón
                </button>
              )}
            </div>
          )}

          {interSubtipo === "list" && (
            <div className="space-y-2">
              <Input
                placeholder="Texto del botón que abre la lista (ej. Ver opciones)"
                value={interBotonLista}
                onChange={(e) => setInterBotonLista(e.target.value)}
              />
              <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Opciones (hasta 10)
              </p>
              {interFilas.map((fila, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      placeholder={`Opción ${i + 1}`}
                      value={fila.titulo}
                      onChange={(e) =>
                        setInterFilas((prev) =>
                          prev.map((f, j) => (j === i ? { ...f, titulo: e.target.value } : f)),
                        )
                      }
                    />
                    <Input
                      placeholder="Descripción (opcional)"
                      value={fila.descripcion}
                      onChange={(e) =>
                        setInterFilas((prev) =>
                          prev.map((f, j) => (j === i ? { ...f, descripcion: e.target.value } : f)),
                        )
                      }
                    />
                  </div>
                  {interFilas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInterFilas((prev) => prev.filter((_, j) => j !== i))}
                      className="mt-2 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label="Quitar opción"
                    >
                      <Icon name="mdi:close" size={16} />
                    </button>
                  )}
                </div>
              ))}
              {interFilas.length < 10 && (
                <button
                  type="button"
                  onClick={() => setInterFilas((prev) => [...prev, { titulo: "", descripcion: "" }])}
                  className="flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  <Icon name="mdi:plus" size={14} />
                  Agregar opción
                </button>
              )}
            </div>
          )}

          {interSubtipo === "cta_url" && (
            <div className="space-y-2">
              <Input
                placeholder="Texto del botón (ej. Ver catálogo)"
                value={interTextoBoton}
                onChange={(e) => setInterTextoBoton(e.target.value)}
              />
              <Input
                placeholder="https://…"
                value={interUrl}
                onChange={(e) => setInterUrl(e.target.value)}
              />
            </div>
          )}

          {interSubtipo === "location_request" && (
            <p className="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              <Icon name="mdi:information-outline" size={14} />
              Le aparece un botón &quot;Enviar ubicación&quot; que abre el selector de mapa del contacto.
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={modalReenvioAbierto}
        onClose={cerrarModalReenvio}
        header={
          <div className="px-5 py-4">
            <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
              Reenviar {idsReenvio.length} mensaje{idsReenvio.length === 1 ? "" : "s"}
            </h3>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              Elige otro chat (debe estar dentro de la ventana de 24h).
            </p>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            <Button type="button" variant="outline" size="sm" onClick={cerrarModalReenvio}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              loading={reenviar.isPending}
              disabled={!destinoReenvio || idsReenvio.length === 0}
              onClick={() =>
                reenviar.mutate(undefined, {
                  onSuccess: (resultado) => {
                    if (resultado) {
                      if (resultado.fallidos.length > 0) {
                        toast.success(
                          `Reenviados ${resultado.enviados}; ${resultado.fallidos.length} fallaron`,
                        );
                      } else {
                        toast.success("Mensajes reenviados");
                      }
                    }
                    cerrarModalReenvio();
                    salirModoSeleccionReenvio();
                  },
                })
              }
            >
              Reenviar
            </Button>
          </div>
        }
      >
        <div className="px-5 py-4">
          <Select
            options={(chatsQuery.data ?? [])
              .filter((c: ConversacionResumen) => c.id !== id && !c.bloqueado)
              .map((c: ConversacionResumen) => ({
                value: c.id,
                label: c.lead?.nombre ?? c.nombreContacto ?? `+${c.waId}`,
              }))}
            placeholder={chatsQuery.isLoading ? "Cargando chats…" : "Elige el chat destino"}
            value={destinoReenvio}
            onChange={setDestinoReenvio}
          />
        </div>
      </Modal>
    </div>
  );
}
