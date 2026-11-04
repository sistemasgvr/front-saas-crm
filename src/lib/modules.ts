import type { MeResponse, ModuloEstado } from "./auth";
import { tienePermiso } from "./permisos";

export function isModuloHabilitado(
  modulos: ModuloEstado[],
  codigo: string,
): boolean {
  return modulos.some((m) => m.codigo === codigo && m.habilitado);
}

/**
 * Primera ruta de cliente según permisos efectivos (ya limitados por módulos).
 * Quien no ve el dashboard aterriza en leads/chats/inmuebles (su trabajo).
 */
export function getDefaultClientRoute(me: Pick<MeResponse, "permisos">): string {
  if (tienePermiso(me.permisos, "dashboard.ver")) return "/dashboard";
  if (tienePermiso(me.permisos, "leads.ver")) return "/leads";
  if (tienePermiso(me.permisos, "chats.ver")) return "/chats";
  if (tienePermiso(me.permisos, "inmuebles.ver")) return "/inmuebles";
  return "/profile";
}
