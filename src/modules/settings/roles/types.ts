export interface PermisoCatalogo {
  codigo: string;
  nombre: string;
  descripcion: string;
  requiere: string[];
}

/** Permisos agrupados por módulo activo; `modulo` null = Empresa. */
export interface GrupoPermisos {
  modulo: string | null;
  nombre: string;
  permisos: PermisoCatalogo[];
}

export interface RolEmpresa {
  id: string;
  /** PROPIETARIO | ADMINISTRADOR | USUARIO en roles de sistema; null en personalizados. */
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  esSistema: boolean;
  permisos: string[];
  usuarios: number;
  esPropio: boolean;
  editable: boolean;
  motivo: string | null;
}

export interface DatosRol {
  nombre?: string;
  descripcion?: string | null;
  permisos?: string[];
}
