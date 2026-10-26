"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import { runAction } from "@/src/lib/server-action";
import type { ActionResult } from "@/src/lib/action-result";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function linkWhatsappNumeroAction(
  wabaId: string,
  phoneNumberId: string,
  numeroDisplay?: string,
  nombreVerificado?: string,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch("/whatsapp/connections", {
        method: "POST",
        body: JSON.stringify({ wabaId, phoneNumberId, numeroDisplay, nombreVerificado }),
      });
    } catch (error) {
      fail(error, "No se pudo vincular el número de WhatsApp");
    }
  });
}

export async function unlinkWhatsappNumeroAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch(`/whatsapp/connections/${id}`, { method: "DELETE" });
    } catch (error) {
      fail(error, "No se pudo desvincular el número");
    }
  });
}

export interface ResultadoResyncWebhookWhatsapp {
  ok: true;
  camposSuscritos: string[];
  camposFaltantes: string[];
}

export async function resyncWhatsappWebhookAction(
  id: string,
): Promise<ActionResult<ResultadoResyncWebhookWhatsapp>> {
  return runAction(async () => {
    try {
      return await apiFetch<ResultadoResyncWebhookWhatsapp>(
        `/whatsapp/connections/${id}/resync-webhook`,
        { method: "POST" },
      );
    } catch (error) {
      fail(error, "No se pudo re-suscribir el webhook");
    }
  });
}

export interface ResultadoSaludWebhookWhatsapp {
  webhookSuscrito: boolean | null;
  suscripcionAppActiva: boolean | null;
  camposVerificados: boolean;
  numero: { estado: string | null; plataforma: string | null; enAppBusiness: boolean | null; verificacionCodigo: string | null; saludEnvio: string | null };
  erroresEnvio: { codigo: number | null; descripcion: string; solucion: string | null }[];
  erroresVerificacion: string[];
  verificadoEn: string;
  ultimoMensajeEntranteEn: string | null;
  camposSuscritos: string[];
  camposFaltantes: string[];
  /** Opcionales que el CRM ya procesa (alertas, plantillas, preferencias…). */
  camposRecomendadosFaltantes: string[];
  webhookUltimoError: string | null;
}

export async function verificarWhatsappWebhookAction(
  id: string,
): Promise<ActionResult<ResultadoSaludWebhookWhatsapp>> {
  return runAction(async () => {
    try {
      return await apiFetch<ResultadoSaludWebhookWhatsapp>(
        `/whatsapp/connections/${id}/verificar-webhook`,
        { method: "POST" },
      );
    } catch (error) {
      fail(error, "No se pudo verificar el webhook en Meta");
    }
  });
}

export interface CrearPlantillaInput {
  nombre: string;
  categoria: "AUTHENTICATION" | "MARKETING" | "UTILITY";
  idioma: string;
  cuerpo: string;
  ejemplosCuerpo?: string[];
  encabezado?: string;
  ejemploEncabezado?: string;
  pie?: string;
}

export async function crearPlantillaWhatsAppAction(input: CrearPlantillaInput): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch("/whatsapp/chats/templates", {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch (error) {
      fail(error, "No se pudo crear la plantilla");
    }
  });
}
