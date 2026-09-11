import type { MeResponse, ModuloEstado } from "./auth";
import { canViewOrgDashboard } from "./roles";

export function isModuloHabilitado(modulos: ModuloEstado[], codigo: string): boolean {
  return modulos.some((m) => m.codigo === codigo && m.habilitado);
}

/**
 * Primera ruta de cliente según módulos y rol.
 * USUARIO no aterriza en el dashboard org: va a leads/chats/agenda (su trabajo).
 */
export function getDefaultClientRoute(
  me: Pick<MeResponse, "modulos" | "rol">,
): string {
  if (canViewOrgDashboard(me.rol) && isModuloHabilitado(me.modulos, "DASHBOARD")) {
    return "/dashboard";
  }
  if (isModuloHabilitado(me.modulos, "META_LEADS")) return "/leads";
  if (isModuloHabilitado(me.modulos, "WHATSAPP")) return "/chats";
  if (isModuloHabilitado(me.modulos, "CRM")) return "/inmuebles";
  return "/profile";
}
