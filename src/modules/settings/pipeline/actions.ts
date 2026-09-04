"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import type { PipelineConfigOverride, PipelineConfigResponse } from "./types";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function updatePipelineConfigAction(
  config: PipelineConfigOverride | null,
): Promise<PipelineConfigResponse> {
  try {
    return await apiFetch<PipelineConfigResponse>("/organizations/current/pipeline-config", {
      method: "PATCH",
      body: JSON.stringify({ config }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar la configuración del pipeline");
  }
}
