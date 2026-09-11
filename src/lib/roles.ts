/** Roles que administran la organización (config, dashboard org, asignaciones). */
export function canManageOrganization(rol: string | null | undefined) {
  return rol === "PROPIETARIO" || rol === "ADMINISTRADOR";
}

/** Dashboard de KPIs/ads a nivel organización: solo admins. */
export function canViewOrgDashboard(rol: string | null | undefined) {
  return canManageOrganization(rol);
}
