"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import type { PipelineConfigOverride, PipelineConfigResponse } from "./types";
import { runAction } from "@/src/lib/server-action";
import type { ActionResult } from "@/src/lib/action-result";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function updatePipelineConfigAction(
  config: PipelineConfigOverride | null,
): Promise<ActionResult<PipelineConfigResponse>> {
  return runAction(async () => {
    try {
      return await apiFetch<PipelineConfigResponse>("/organizations/current/pipeline-config", {
        method: "PATCH",
        body: JSON.stringify({ config }),
      });
    } catch (error) {
      fail(error, "No se pudo guardar la configuración del pipeline");
    }
  });
}
