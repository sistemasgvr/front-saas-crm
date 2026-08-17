export function canManageOrganization(rol: string | null | undefined) {
  return rol === "PROPIETARIO" || rol === "ADMINISTRADOR";
}
