import type { PaginatedResult } from "@/src/lib/pagination";
export interface UsuarioEmpresa {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  rol: "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO";
  estado: number;
  cuentaActiva: boolean;
  debeCambiarPassword: number;
  leadsAsignados: number;
}
export interface UsuariosEmpresaResponse extends PaginatedResult<UsuarioEmpresa> {
  activos: number;
  limite: number | null;
}
