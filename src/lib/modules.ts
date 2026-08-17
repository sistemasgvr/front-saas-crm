import type { MeResponse, ModuloEstado } from "./auth";

export function isModuloHabilitado(modulos: ModuloEstado[], codigo: string): boolean {
  return modulos.some((m) => m.codigo === codigo && m.habilitado);
}

/** Primera ruta de cliente según módulos habilitados en GET /me. */
export function getDefaultClientRoute(me: Pick<MeResponse, "modulos">): string {
  if (isModuloHabilitado(me.modulos, "DASHBOARD")) return "/dashboard";
  if (isModuloHabilitado(me.modulos, "META_LEADS")) return "/leads";
  return "/profile";
}
