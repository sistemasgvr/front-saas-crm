"use server";
import { apiFetchCollection } from "@/src/lib/api-collection";

import { apiFetch, ApiError } from "@/src/lib/api";
import type { ModuloAdmin, ModuloGrupo } from "../types";
import type {
  AutomationIntegration,
  AutomationIntegrationInput,
} from "./integration-types";
import type { ResultadoControl } from "../../chats/control-types";

export async function getAdminModules() {
  return apiFetchCollection<ModuloAdmin>("/admin/modules");
}
export async function getAutomationIntegration() {
  return apiFetch<AutomationIntegration>("/admin/automations/integration");
}
export async function guardarAutomationIntegration(
  input: AutomationIntegrationInput,
): Promise<ResultadoControl<AutomationIntegration>> {
  try {
    return {
      ok: true,
      data: await apiFetch<AutomationIntegration>(
        "/admin/automations/integration",
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo guardar n8n",
      status: e instanceof ApiError ? e.status : 0,
    };
  }
}

export async function getAdminModuleGroups() {
  return apiFetchCollection<ModuloGrupo>("/admin/module-groups");
}
