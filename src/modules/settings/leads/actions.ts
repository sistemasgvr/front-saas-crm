"use server";

import { apiFetch, ApiError } from "@/src/lib/api";

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export interface UpdateLeadAutoAsignacionConfigInput {
  habilitado: boolean;
  usuarioIds: string[];
}

export async function updateLeadAutoAsignacionConfigAction(
  input: UpdateLeadAutoAsignacionConfigInput,
): Promise<void> {
  try {
    await apiFetch("/leads/auto-asignacion/config", {
      method: "PATCH",
      body: JSON.stringify({
        habilitado: input.habilitado,
        usuarioIds: input.usuarioIds,
      }),
    });
  } catch (error) {
    fail(error, "No se pudo guardar la configuración de auto-asignación");
  }
}

