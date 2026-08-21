"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import type { ResultadoSyncLeadsOrganizacion } from "./types";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function syncAllLeadsFromMetaAction(): Promise<ResultadoSyncLeadsOrganizacion> {
  try {
    return await apiFetch<ResultadoSyncLeadsOrganizacion>("/meta/leads/sync", { method: "POST" });
  } catch (error) {
    fail(error, "No se pudieron sincronizar los leads desde Meta");
  }
}
