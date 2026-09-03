"use client";

/**
 * Stickers favoritos del CRM (IndexedDB). No es la tienda/favoritos oficiales
 * de WhatsApp — Cloud API no los expone.
 */

const DB_NAME = "crm-whatsapp-stickers";
const DB_VERSION = 1;
const STORE = "favoritos";

export interface StickerFavorito {
  id: string;
  nombre: string;
  mimeType: string;
  blob: Blob;
  creadoEn: number;
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("No se pudo abrir IndexedDB"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Transacción IndexedDB falló"));
    tx.onabort = () => reject(tx.error ?? new Error("Transacción IndexedDB abortada"));
  });
}

export async function listarFavoritos(): Promise<StickerFavorito[]> {
  const db = await abrirDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as StickerFavorito[]).sort((a, b) => b.creadoEn - a.creadoEn);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function esFavorito(id: string): Promise<boolean> {
  const db = await abrirDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(Boolean(req.result));
    req.onerror = () => reject(req.error);
  });
}

export async function guardarFavorito(fav: Omit<StickerFavorito, "creadoEn"> & { creadoEn?: number }): Promise<void> {
  const db = await abrirDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put({
    ...fav,
    creadoEn: fav.creadoEn ?? Date.now(),
  } satisfies StickerFavorito);
  await txDone(tx);
}

export async function quitarFavorito(id: string): Promise<void> {
  const db = await abrirDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
}

/** Descarga el webp del proxy de media y lo guarda como favorito. */
export async function favoritoDesdeMensaje(params: {
  mensajeId: string;
  conversacionId: string;
  nombre?: string;
}): Promise<void> {
  const res = await fetch(`/api/whatsapp/media/${params.conversacionId}/${params.mensajeId}`);
  if (!res.ok) throw new Error("No se pudo descargar el sticker");
  const blob = await res.blob();
  const mimeType = blob.type || "image/webp";
  if (!mimeType.includes("webp") && !mimeType.includes("image")) {
    throw new Error("El mensaje no parece un sticker válido");
  }
  await guardarFavorito({
    id: params.mensajeId,
    nombre: params.nombre ?? "Sticker",
    mimeType: "image/webp",
    blob: blob.type === "image/webp" ? blob : new Blob([blob], { type: "image/webp" }),
  });
}

export function objectUrlDeFavorito(fav: StickerFavorito): string {
  return URL.createObjectURL(fav.blob);
}
