"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/src/lib/api";
import type { MetaConnection, ResultadoBackfill, ResultadoSyncFormularios, ResultadoSyncInsights } from "./types";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

/** Sync/backfill contra Graph API puede tardar bastante más que una llamada
 * normal (varios formularios/campañas, rate limiting propio de Meta) — el
 * timeout por defecto de apiFetch (20s) las cortaría de mitad de camino. */
const TIMEOUT_SYNC_MS = 90_000;

export async function saveMetaAppCredentialsAction(appId: string, appSecret: string): Promise<MetaConnection> {
  try {
    return await apiFetch<MetaConnection>("/meta/connections/app-credentials", {
      method: "POST",
      body: JSON.stringify({ appId, appSecret }),
    });
  } catch (error) {
    fail(error, "No se pudieron guardar las credenciales de la Meta App");
  }
}

export async function connectMetaAction() {
  let url: string;
  try {
    const data = await apiFetch<{ url: string }>("/meta/oauth/url");
    url = data.url;
  } catch (error) {
    fail(error, "No se pudo iniciar la conexión con Meta");
  }
  redirect(url);
}

/** Reconecta pidiendo que Meta vuelva a mostrar el diálogo de permisos que el
 * usuario haya denegado antes (`auth_type=rerequest`) — PLAN-FASE-16 §6.2. */
export async function reconnectMetaAction() {
  let url: string;
  try {
    const data = await apiFetch<{ url: string }>("/meta/oauth/url?rerequest=1");
    url = data.url;
  } catch (error) {
    fail(error, "No se pudo iniciar la reconexión con Meta");
  }
  redirect(url);
}

/** Pide en Meta solo los scopes de una feature puntual (botón "Otorgar en Meta"
 * de una fila opt-in) — PLAN-FASE-16-META-PERMISOS.md §6.1/§8. */
export async function grantMetaFeatureAction(featureId: string) {
  let url: string;
  try {
    const data = await apiFetch<{ url: string }>(
      `/meta/oauth/url?features=${encodeURIComponent(featureId)}&rerequest=1`,
    );
    url = data.url;
  } catch (error) {
    fail(error, "No se pudo iniciar la solicitud del permiso en Meta");
  }
  redirect(url);
}

export async function toggleMetaFeatureAction(
  featureId: string,
  deseada: boolean,
  revocarEnMeta?: boolean,
): Promise<void> {
  try {
    await apiFetch("/meta/connections/permissions/features", {
      method: "PATCH",
      body: JSON.stringify({ featureId, deseada, revocarEnMeta }),
    });
  } catch (error) {
    fail(error, "No se pudo actualizar la preferencia del permiso");
  }
}

export async function disconnectMetaAction(): Promise<void> {
  try {
    await apiFetch("/meta/connections/disconnect", { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo desconectar Meta");
  }
}

export async function linkMetaPageAction(pageId: string, pageNombre: string): Promise<void> {
  try {
    await apiFetch("/meta/pages", { method: "POST", body: JSON.stringify({ pageId, pageNombre }) });
  } catch (error) {
    fail(error, "No se pudo vincular la página");
  }
}

export async function unlinkMetaPageAction(id: string): Promise<void> {
  try {
    await apiFetch(`/meta/pages/${id}`, { method: "DELETE" });
  } catch (error) {
    fail(error, "No se pudo desvincular la página");
  }
}

export async function resyncMetaPageWebhookAction(id: string): Promise<void> {
  try {
    await apiFetch(`/meta/pages/${id}/resync-webhook`, { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo re-suscribir el webhook");
  }
}

export interface ResultadoSaludWebhook {
  webhookSuscrito: boolean;
  webhookUltimoError: string | null;
}

export async function healthCheckMetaPageAction(id: string): Promise<ResultadoSaludWebhook> {
  try {
    return await apiFetch<ResultadoSaludWebhook>(`/meta/pages/${id}/health-check`, { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo verificar el webhook en Meta");
  }
}

export async function linkMetaAdAccountAction(adAccountId: string, adAccountNombre: string): Promise<void> {
  try {
    await apiFetch("/meta/ad-accounts", {
      method: "POST",
      body: JSON.stringify({ adAccountId, adAccountNombre }),
    });
  } catch (error) {
    fail(error, "No se pudo vincular la cuenta publicitaria");
  }
}

export async function unlinkMetaAdAccountAction(id: string): Promise<void> {
  try {
    await apiFetch(`/meta/ad-accounts/${id}`, { method: "DELETE" });
  } catch (error) {
    fail(error, "No se pudo desvincular la cuenta publicitaria");
  }
}

export interface ResultadoSync {
  campanas: number;
  conjuntos: number;
  anuncios: number;
  /** true si Graph cortó la paginación (jerarquía incompleta). */
  truncado?: boolean;
  aviso?: string;
}

export async function syncMetaAdAccountAction(id: string): Promise<ResultadoSync> {
  try {
    return await apiFetch<ResultadoSync>(`/meta/ad-accounts/${id}/sync`, {
      method: "POST",
      timeoutMs: TIMEOUT_SYNC_MS,
    });
  } catch (error) {
    fail(error, "No se pudo sincronizar la cuenta publicitaria");
  }
}

export async function syncMetaAdAccountInsightsAction(
  id: string,
  desde: string,
  hasta: string,
): Promise<ResultadoSyncInsights> {
  try {
    return await apiFetch<ResultadoSyncInsights>(`/meta/ad-accounts/${id}/insights/sync`, {
      method: "POST",
      body: JSON.stringify({ desde, hasta }),
      timeoutMs: TIMEOUT_SYNC_MS,
    });
  } catch (error) {
    fail(error, "No se pudieron sincronizar las métricas");
  }
}

export async function syncMetaPageFormsAction(pageId: string): Promise<ResultadoSyncFormularios> {
  try {
    return await apiFetch<ResultadoSyncFormularios>(`/meta/pages/${pageId}/forms/sync`, {
      method: "POST",
      timeoutMs: TIMEOUT_SYNC_MS,
    });
  } catch (error) {
    fail(error, "No se pudieron sincronizar los formularios");
  }
}

/** Bajo demanda: golpea Graph API por cada formulario de la página para
 * comparar el total real de Meta contra lo ya importado. */
export async function contarLeadsMetaPaginaAction(
  pageId: string,
): Promise<Record<string, number>> {
  try {
    return await apiFetch<Record<string, number>>(`/meta/pages/${pageId}/forms/meta-counts`, {
      method: "POST",
      timeoutMs: TIMEOUT_SYNC_MS,
    });
  } catch (error) {
    fail(error, "No se pudo obtener el conteo de leads en Meta");
  }
}

export async function backfillMetaPageFormAction(
  pageId: string,
  formId: string,
  body: { desde?: string; hasta?: string; cursor?: string },
): Promise<ResultadoBackfill> {
  try {
    return await apiFetch<ResultadoBackfill>(`/meta/pages/${pageId}/forms/${formId}/backfill`, {
      method: "POST",
      body: JSON.stringify(body),
      timeoutMs: TIMEOUT_SYNC_MS,
    });
  } catch (error) {
    fail(error, "No se pudo reimportar los leads de este formulario");
  }
}
