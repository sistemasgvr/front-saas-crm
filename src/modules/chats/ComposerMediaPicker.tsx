"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EmojiPicker, {
  Theme as TemaEmojiPicker,
  type EmojiClickData,
} from "emoji-picker-react";
import { GifPicker, Theme as TemaGifPicker, type Gif } from "gif-picker-react";
import { Klipy } from "gif-picker-react/providers/klipy";
import { Icon } from "@/src/components/ui/Icon";
import { useTheme } from "@/src/context/ThemeContext";
import packStickers from "./sticker-pack.json";
import {
  listarFavoritos,
  objectUrlDeFavorito,
  quitarFavorito,
  type StickerFavorito,
} from "./sticker-favoritos";

const ANCHO_PICKER = 350;
const ALTO_CONTENIDO = 380;
const MARGEN_VIEWPORT = 8;

export type TabComposerPicker = "emoji" | "gif" | "sticker";

export interface StickerPackItem {
  id: string;
  nombre: string;
  src: string;
  /** Si viene de IndexedDB, el blob para reenviar sin re-fetch. */
  blob?: Blob;
}

type Props = {
  abierto: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onCerrar: () => void;
  onEmoji: (emoji: string) => void;
  onGif: (gif: Gif) => void;
  onSticker: (sticker: StickerPackItem) => void;
  onSubirSticker: () => void;
};

/**
 * Panel unificado estilo WhatsApp Web: tabs Emoji | GIF | Stickers.
 * - Emoji: emoji-picker-react
 * - GIF: gif-picker-react + Klipy (NEXT_PUBLIC_KLIPY_API_KEY)
 * - Stickers: favoritos locales + pack propio (Cloud API no expone la tienda)
 */
export function ComposerMediaPicker({
  abierto,
  anchorRef,
  onCerrar,
  onEmoji,
  onGif,
  onSticker,
  onSubirSticker,
}: Props) {
  const [tab, setTab] = useState<TabComposerPicker>("emoji");
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const [favoritos, setFavoritos] = useState<StickerFavorito[]>([]);
  const [urlsFavoritos, setUrlsFavoritos] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const oscuro = theme === "dark";
  const klipyKey = process.env.NEXT_PUBLIC_KLIPY_API_KEY?.trim() ?? "";

  useEffect(() => {
    let cancelado = false;
    const urlsCreadas: string[] = [];

    async function cargar() {
      try {
        const rows = await listarFavoritos();
        if (cancelado) return;
        const map: Record<string, string> = {};
        for (const f of rows) {
          const url = objectUrlDeFavorito(f);
          urlsCreadas.push(url);
          map[f.id] = url;
        }
        setFavoritos(rows);
        setUrlsFavoritos(map);
      } catch {
        if (!cancelado) {
          setFavoritos([]);
          setUrlsFavoritos({});
        }
      }
    }

    if (abierto && tab === "sticker") void cargar();

    function onChanged() {
      if (abierto && tab === "sticker") void cargar();
    }
    window.addEventListener("crm-sticker-favoritos-changed", onChanged);
    return () => {
      cancelado = true;
      window.removeEventListener("crm-sticker-favoritos-changed", onChanged);
      for (const u of urlsCreadas) URL.revokeObjectURL(u);
    };
  }, [abierto, tab]);

  useLayoutEffect(() => {
    if (!abierto) {
      setPos(null);
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const altoTotal = ALTO_CONTENIDO + 48;
    const hayEspacioArriba = rect.top - altoTotal - MARGEN_VIEWPORT > 0;
    const left = Math.min(
      Math.max(rect.left, MARGEN_VIEWPORT),
      window.innerWidth - ANCHO_PICKER - MARGEN_VIEWPORT,
    );
    setPos(
      hayEspacioArriba
        ? { bottom: window.innerHeight - rect.top + MARGEN_VIEWPORT, left }
        : { top: rect.bottom + MARGEN_VIEWPORT, left },
    );
  }, [abierto, anchorRef, tab]);

  useEffect(() => {
    if (!abierto) return;
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("touchstart", onClickFuera, { passive: true });
    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("touchstart", onClickFuera);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [abierto, onCerrar, anchorRef]);

  if (!abierto || !pos || typeof document === "undefined") return null;

  const tabs: { id: TabComposerPicker; icon: string; label: string }[] = [
    { id: "emoji", icon: "mdi:emoticon-outline", label: "Emojis" },
    { id: "gif", icon: "mdi:file-gif-box", label: "GIF" },
    { id: "sticker", icon: "mdi:sticker-emoji", label: "Stickers" },
  ];

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-99999 flex w-[350px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
      style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
    >
      <div className="min-h-0 flex-1" style={{ height: ALTO_CONTENIDO }}>
        {tab === "emoji" && (
          <EmojiPicker
            theme={oscuro ? TemaEmojiPicker.DARK : TemaEmojiPicker.LIGHT}
            onEmojiClick={(data: EmojiClickData) => onEmoji(data.emoji)}
            autoFocusSearch={false}
            searchPlaceholder="Busca un emoji"
            width="100%"
            height={ALTO_CONTENIDO}
            previewConfig={{ showPreview: false }}
          />
        )}

        {tab === "gif" &&
          (klipyKey ? (
            <GifPicker
              provider={Klipy(klipyKey)}
              theme={oscuro ? TemaGifPicker.DARK : TemaGifPicker.LIGHT}
              onGifClick={(gif) => {
                onGif(gif);
                onCerrar();
              }}
              autoFocusSearch={false}
              width="100%"
              height={ALTO_CONTENIDO}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <Icon name="mdi:gif" size={36} className="text-gray-400" />
              <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                Falta la API key de GIFs
              </p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Configura <code className="text-brand-500">NEXT_PUBLIC_KLIPY_API_KEY</code> en el
                entorno del front (gratis en Klipy Partner Panel).
              </p>
            </div>
          ))}

        {tab === "sticker" && (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {favoritos.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 px-1 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    Favoritos
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {favoritos.map((f) => (
                      <div key={f.id} className="group relative">
                        <button
                          type="button"
                          title={f.nombre}
                          onClick={() => {
                            onSticker({
                              id: f.id,
                              nombre: f.nombre,
                              src: urlsFavoritos[f.id] ?? "",
                              blob: f.blob,
                            });
                            onCerrar();
                          }}
                          className="flex aspect-square w-full items-center justify-center rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={urlsFavoritos[f.id]}
                            alt={f.nombre}
                            className="max-h-full max-w-full object-contain"
                          />
                        </button>
                        <button
                          type="button"
                          title="Quitar de favoritos"
                          onClick={(e) => {
                            e.stopPropagation();
                            void quitarFavorito(f.id).then(() => {
                              window.dispatchEvent(new Event("crm-sticker-favoritos-changed"));
                            });
                          }}
                          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <Icon name="mdi:close" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mb-1.5 px-1 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                Pack del CRM
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSubirSticker();
                    onCerrar();
                  }}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 text-gray-500 transition hover:border-brand-500 hover:text-brand-500 dark:border-gray-600"
                  title="Subir sticker .webp"
                >
                  <Icon name="mdi:plus" size={28} />
                  <span className="text-[10px] font-medium">Subir</span>
                </button>
                {(packStickers as StickerPackItem[]).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    title={s.nombre}
                    onClick={() => {
                      onSticker(s);
                      onCerrar();
                    }}
                    className="flex aspect-square items-center justify-center rounded-xl p-1.5 transition hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.src} alt={s.nombre} className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-around border-t border-gray-100 bg-gray-50 px-2 py-1.5 dark:border-gray-800 dark:bg-gray-950">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            title={t.label}
            aria-label={t.label}
            className={`flex h-10 w-12 items-center justify-center rounded-lg transition ${
              tab === t.id
                ? "bg-white text-brand-500 shadow-theme-xs dark:bg-gray-800"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
            }`}
          >
            {t.id === "gif" ? (
              <span className="text-[11px] font-bold tracking-wide">GIF</span>
            ) : (
              <Icon name={t.icon} size={22} />
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
