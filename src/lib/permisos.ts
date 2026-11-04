/**
 * Códigos de permisos granulares. Espejo de
 * back-saas-crm/src/shared/domain/permisos.ts (el backend es la fuente de
 * verdad y vuelve a validar cada acción). `me.permisos` ya trae los efectivos:
 * rol de la empresa ∩ módulos activos por la plataforma.
 */
export type CodigoPermiso =
  | "empresa.configurar"
  | "usuarios.gestionar"
  | "roles.gestionar"
  | "dashboard.ver"
  | "leads.ver"
  | "leads.ver_todos"
  | "leads.editar"
  | "leads.reclamar"
  | "leads.asignar"
  | "leads.configurar"
  | "inmuebles.ver"
  | "inmuebles.crear"
  | "inmuebles.editar"
  | "inmuebles.eliminar"
  | "meta.ver"
  | "meta.configurar"
  | "chats.ver"
  | "chats.responder"
  | "chats.gestionar_todos"
  | "chats.plantillas"
  | "llamadas.usar"
  | "whatsapp.configurar"
  | "bot.configurar";

export function tienePermiso(
  permisos: readonly string[] | null | undefined,
  codigo: CodigoPermiso,
): boolean {
  return !!permisos?.includes(codigo);
}

/** Permisos que dan acceso a alguna sección de Configuración. */
export const PERMISOS_CONFIGURACION: readonly CodigoPermiso[] = [
  "empresa.configurar",
  "usuarios.gestionar",
  "roles.gestionar",
  "leads.configurar",
  "inmuebles.crear",
  "meta.configurar",
  "whatsapp.configurar",
  "bot.configurar",
];

export function puedeVerConfiguracion(
  permisos: readonly string[] | null | undefined,
): boolean {
  return PERMISOS_CONFIGURACION.some((p) => tienePermiso(permisos, p));
}
