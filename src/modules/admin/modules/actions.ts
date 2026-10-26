"use server";

import { apiFetch, ApiError } from "@/src/lib/api";
import { runAction } from "@/src/lib/server-action";

function emptyToUndefined(value: string) {
  return value.trim() === "" ? undefined : value.trim();
}

function fail(error: unknown, fallback: string): never {
  throw new Error(error instanceof ApiError ? error.message : fallback);
}

export async function createModuleAction(formData: FormData) {
  return runAction(async () => {
    try {
      await apiFetch("/admin/modules", {
        method: "POST",
        body: JSON.stringify({
          codigo: String(formData.get("codigo") ?? "").trim(),
          nombre: String(formData.get("nombre") ?? "").trim(),
          descripcion: emptyToUndefined(
            String(formData.get("descripcion") ?? ""),
          ),
          icono: emptyToUndefined(String(formData.get("icono") ?? "")),
          orden: Number(formData.get("orden") ?? 0),
          grupoId: String(formData.get("grupoId") ?? ""),
          requiere: String(formData.get("requiere") ?? "")
            .split(",")
            .filter(Boolean),
        }),
      });
    } catch (error) {
      fail(error, "No se pudo crear el módulo");
    }
  });
}

export async function updateModuleAction(id: string, formData: FormData) {
  return runAction(async () => {
    try {
      await apiFetch(`/admin/modules/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nombre: String(formData.get("nombre") ?? "").trim(),
          descripcion: emptyToUndefined(
            String(formData.get("descripcion") ?? ""),
          ),
          icono: emptyToUndefined(String(formData.get("icono") ?? "")),
          orden: Number(formData.get("orden") ?? 0),
          grupoId: String(formData.get("grupoId") ?? ""),
          requiere: String(formData.get("requiere") ?? "")
            .split(",")
            .filter(Boolean),
        }),
      });
    } catch (error) {
      fail(error, "No se pudo guardar");
    }
  });
}

export async function toggleModuleStatusAction(id: string, estado: 0 | 1) {
  return runAction(async () => {
    try {
      await apiFetch(`/admin/modules/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
    } catch (error) {
      fail(error, "No se pudo actualizar el módulo");
    }
  });
}

export async function saveModuleGroupAction(
  id: string | null,
  values: {
    codigo?: string;
    nombre: string;
    icono: string;
    orden: number;
    descripcion: string;
  },
) {
  return runAction(async () => {
    const { codigo, ...fields } = values;
    try {
      await apiFetch(id ? `/admin/module-groups/${id}` : "/admin/module-groups", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(id ? fields : values),
      });
    } catch (error) {
      fail(error, "No se pudo guardar el grupo");
    }
  });
}

export async function toggleModuleGroupStatusAction(
  id: string,
  estado: 0 | 1,
) {
  return runAction(async () => {
    try {
      await apiFetch(`/admin/module-groups/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado }),
      });
    } catch (error) {
      fail(error, "No se pudo actualizar el grupo");
    }
  });
}
