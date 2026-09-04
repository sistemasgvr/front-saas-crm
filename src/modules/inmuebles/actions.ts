"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import type { InmuebleRow } from "./types";

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

function emptyToNull(value: string) {
  return value.trim() === "" ? null : value.trim();
}

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

function parsePrecio(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export async function createInmuebleAction(formData: FormData) {
  try {
    return await apiFetch<InmuebleRow>("/inmuebles", {
      method: "POST",
      body: JSON.stringify({
        codigo: String(formData.get("codigo") ?? "").trim(),
        titulo: String(formData.get("titulo") ?? "").trim(),
        tipo: String(formData.get("tipo") ?? "").trim(),
        operacion: String(formData.get("operacion") ?? "").trim(),
        zona: emptyToUndefined(String(formData.get("zona") ?? "")),
        direccion: emptyToUndefined(String(formData.get("direccion") ?? "")),
        precio: parsePrecio(String(formData.get("precio") ?? "")),
        moneda: emptyToUndefined(String(formData.get("moneda") ?? "")) ?? "PEN",
        estadoInmueble:
          emptyToUndefined(String(formData.get("estadoInmueble") ?? "")) ??
          "DISPONIBLE",
        notas: emptyToUndefined(String(formData.get("notas") ?? "")),
      }),
    });
  } catch (error) {
    fail(error, "No se pudo crear el inmueble");
  }
}

export async function updateInmuebleAction(id: string, formData: FormData) {
  try {
    const precioRaw = String(formData.get("precio") ?? "");
    return await apiFetch<InmuebleRow>(`/inmuebles/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        codigo: String(formData.get("codigo") ?? "").trim(),
        titulo: String(formData.get("titulo") ?? "").trim(),
        tipo: String(formData.get("tipo") ?? "").trim(),
        operacion: String(formData.get("operacion") ?? "").trim(),
        zona: emptyToNull(String(formData.get("zona") ?? "")),
        direccion: emptyToNull(String(formData.get("direccion") ?? "")),
        precio: precioRaw.trim() === "" ? null : parsePrecio(precioRaw) ?? null,
        moneda: String(formData.get("moneda") ?? "PEN").trim() || "PEN",
        estadoInmueble: String(formData.get("estadoInmueble") ?? "").trim(),
        notas: emptyToNull(String(formData.get("notas") ?? "")),
      }),
    });
  } catch (error) {
    fail(error, "No se pudo actualizar el inmueble");
  }
}

export async function deleteInmuebleAction(id: string) {
  try {
    await apiFetch(`/inmuebles/${id}`, { method: "DELETE" });
  } catch (error) {
    fail(error, "No se pudo eliminar el inmueble");
  }
}
