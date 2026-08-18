export interface OrganizacionAdmin {
  id: string;
  nombre: string;
  slug: string;
  razonSocial: string | null;
  documentoFiscal: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  logoUrl: string | null;
  pais: string | null;
  zonaHoraria: string;
  notas: string | null;
  estado: number;
  fechaCreacion: string;
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  esAdminPlataforma: boolean;
  estado: number;
  ultimoLogin: string | null;
  fechaCreacion: string;
}

export interface UsuarioAdminDetalle extends UsuarioAdmin {
  organizaciones: {
    organizacionId: string;
    organizacionNombre: string;
    rol: "PROPIETARIO" | "ADMINISTRADOR" | "USUARIO";
    estado: number;
  }[];
}

export interface ModuloAdmin {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  estado: number;
}

export interface ModuloMatriz {
  id: string;
  codigo: string;
  nombre: string;
  icono: string | null;
  orden: number;
  habilitado: boolean;
}

export interface FiltroAdminOrganizaciones {
  page?: number;
  pageSize?: number;
  q?: string;
  estado?: 0 | 1;
}

export interface FiltroAdminUsuarios extends FiltroAdminOrganizaciones {
  esAdminPlataforma?: 0 | 1;
}

export interface ListaOrganizacionesResultado {
  data: OrganizacionAdmin[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListaUsuariosResultado {
  data: UsuarioAdmin[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
