"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import { runAction } from "@/src/lib/server-action";
import type { ActionResult } from "@/src/lib/action-result";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export interface UpdateLeadAutoAsignacionConfigInput {
  limitesDiarios?: Record<string, number>;
  habilitado: boolean;
  usuarioIds: string[];
}

export async function updateLeadAutoAsignacionConfigAction(
  input: UpdateLeadAutoAsignacionConfigInput,
): Promise<ActionResult<void>> {
  return runAction(async () => {
    try {
      await apiFetch("/leads/auto-asignacion/config", {
        method: "PATCH",
        body: JSON.stringify({
          habilitado: input.habilitado,
          usuarioIds: input.usuarioIds,
          limitesDiarios: input.limitesDiarios,
        }),
      });
    } catch (error) {
      fail(error, "No se pudo guardar la configuración de auto-asignación");
    }
  });
}

