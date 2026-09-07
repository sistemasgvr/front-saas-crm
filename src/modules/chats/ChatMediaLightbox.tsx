"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Lightbox, { type Slide } from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Video from "yet-another-react-lightbox/plugins/video";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import type { Mensaje } from "./types";

const TIPOS_VISOR = new Set(["image", "video", "sticker"]);

function urlMedia(conversacionId: string, mensajeId: string) {
  return `/api/whatsapp/media/${conversacionId}/${mensajeId}`;
}

function slideDesdeMensaje(conversacionId: string, mensaje: Mensaje): Slide | null {
  if (!mensaje.tieneMedia || !TIPOS_VISOR.has(mensaje.tipo)) return null;
  const src = urlMedia(conversacionId, mensaje.id);
  const caption = mensaje.mediaCaption?.trim() || undefined;
  const nombre =
    mensaje.mediaNombreArchivo?.trim() ||
    (mensaje.tipo === "video"
      ? "video.mp4"
      : mensaje.tipo === "sticker"
        ? "sticker.webp"
        : "imagen.jpg");

  if (mensaje.tipo === "video") {
    return {
      type: "video",
      sources: [
        {
          src,
          type: mensaje.mediaMimeType?.trim() || "video/mp4",
        },
      ],
      controls: true,
      playsInline: true,
      preload: "metadata",
      title: caption,
      description: caption,
      download: { url: src, filename: nombre },
      // Miniatura en la tira inferior (WhatsApp-style).
      thumbnail: src,
    };
  }

  return {
    src,
    alt: caption ?? (mensaje.tipo === "sticker" ? "Sticker" : "Imagen"),
    title: caption,
    description: caption,
    download: { url: src, filename: nombre },
    imageFit: "contain",
  };
}

interface ChatMediaLightboxContextValue {
  abrirMedia: (mensajeId: string) => void;
}

const ChatMediaLightboxContext = createContext<ChatMediaLightboxContextValue | null>(null);

export function useChatMediaLightbox() {
  return useContext(ChatMediaLightboxContext);
}

export function ChatMediaLightboxProvider({
  conversacionId,
  mensajes,
  children,
}: {
  conversacionId: string;
  mensajes: Mensaje[];
  children: ReactNode;
}) {
  const [indice, setIndice] = useState(-1);

  const { slides, ids } = useMemo(() => {
    const nextSlides: Slide[] = [];
    const nextIds: string[] = [];
    for (const mensaje of mensajes) {
      const slide = slideDesdeMensaje(conversacionId, mensaje);
      if (!slide) continue;
      nextSlides.push(slide);
      nextIds.push(mensaje.id);
    }
    return { slides: nextSlides, ids: nextIds };
  }, [conversacionId, mensajes]);

  const abrirMedia = useCallback(
    (mensajeId: string) => {
      const i = ids.indexOf(mensajeId);
      if (i >= 0) setIndice(i);
    },
    [ids],
  );

  const value = useMemo(() => ({ abrirMedia }), [abrirMedia]);

  return (
    <ChatMediaLightboxContext.Provider value={value}>
      {children}
      <Lightbox
        open={indice >= 0}
        index={indice < 0 ? 0 : indice}
        close={() => setIndice(-1)}
        slides={slides}
        plugins={[Zoom, Download, Fullscreen, Video, Captions, Counter, Thumbnails]}
        toolbar={{
          buttons: ["zoom", "download", "fullscreen", "close"],
        }}
        carousel={{
          finite: slides.length <= 1,
          preload: 2,
          padding: "24px",
          spacing: "16px",
          imageFit: "contain",
        }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        animation={{ fade: 200, swipe: 250 }}
        zoom={{
          maxZoomPixelRatio: 8,
          zoomInMultiplier: 2,
          doubleClickMaxStops: 3,
          scrollToZoom: true,
          wheelZoomDistanceFactor: 80,
        }}
        video={{ controls: true, playsInline: true, preload: "metadata" }}
        captions={{ descriptionTextAlign: "center", descriptionMaxLines: 3 }}
        thumbnails={{
          position: "bottom",
          width: 72,
          height: 72,
          border: 3,
          borderRadius: 10,
          padding: 0,
          gap: 10,
          imageFit: "cover",
          vignette: false,
        }}
        className="yarl__chat-whatsapp"
        portal={{ root: () => document.body }}
        styles={{
          root: {
            zIndex: 1000000,
            backgroundColor: "#e9edef",
            // Variables oficiales del paquete (portal + botones claros).
            ["--yarl__portal_zindex" as string]: 1000000,
            ["--yarl__color_backdrop" as string]: "#e9edef",
            ["--yarl__container_background_color" as string]: "#e9edef",
            ["--yarl__color_button" as string]: "#54656f",
            ["--yarl__color_button_active" as string]: "#111b21",
            ["--yarl__color_button_disabled" as string]: "#8696a0",
            ["--yarl__button_filter" as string]: "none",
            ["--yarl__thumbnails_container_background_color" as string]: "#e9edef",
          },
          container: {
            backgroundColor: "#e9edef",
            color: "#111b21",
          },
          slide: {
            padding: "12px 56px 8px",
          },
          navigationPrev: {
            left: 20,
            top: "50%",
            transform: "translateY(-50%)",
          },
          navigationNext: {
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
          },
          thumbnailsContainer: {
            backgroundColor: "#e9edef",
            width: "100%",
          },
        }}
        on={{
          view: ({ index }) => setIndice(index),
        }}
      />
    </ChatMediaLightboxContext.Provider>
  );
}

export { urlMedia, TIPOS_VISOR };
