"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/src/lib/api";
import type { MetaConnection } from "./types";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

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
}

export async function syncMetaAdAccountAction(id: string): Promise<ResultadoSync> {
  try {
    return await apiFetch<ResultadoSync>(`/meta/ad-accounts/${id}/sync`, { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo sincronizar la cuenta publicitaria");
  }
}
