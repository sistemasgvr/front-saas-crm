import type { OrganizacionAdmin, UsuarioAdminDetalle } from "./types";

export function isActivo(estado: unknown): boolean {
  return Number(estado) === 1;
}

export function asList<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export function organizationSelectOptions(
  organizaciones: OrganizacionAdmin[] | undefined | null,
  membresias: UsuarioAdminDetalle["organizaciones"] = [],
) {
  const options = new Map<string, { value: string; label: string }>();

  for (const org of asList(organizaciones)) {
    if (isActivo(org.estado)) {
      options.set(org.id, { value: org.id, label: org.nombre });
    }
  }

  for (const membresia of membresias) {
    if (!options.has(membresia.organizacionId)) {
      options.set(membresia.organizacionId, {
        value: membresia.organizacionId,
        label: membresia.organizacionNombre,
      });
    }
  }

  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
}
