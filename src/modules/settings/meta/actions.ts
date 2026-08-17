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

export async function selectMetaPageAction(pageId: string, pageNombre: string): Promise<MetaConnection> {
  try {
    return await apiFetch<MetaConnection>("/meta/connections/page", {
      method: "POST",
      body: JSON.stringify({ pageId, pageNombre }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar la página");
  }
}

export async function selectMetaAdAccountAction(
  adAccountId: string,
  adAccountNombre: string,
): Promise<MetaConnection> {
  try {
    return await apiFetch<MetaConnection>("/meta/connections/ad-account", {
      method: "POST",
      body: JSON.stringify({ adAccountId, adAccountNombre }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar la cuenta publicitaria");
  }
}

export async function disconnectMetaAction(): Promise<void> {
  try {
    await apiFetch("/meta/connections/disconnect", { method: "POST" });
  } catch (error) {
    fail(error, "No se pudo desconectar Meta");
  }
}
