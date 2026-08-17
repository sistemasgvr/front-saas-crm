import { apiFetch, ApiError } from './api';

export interface ModuloEstado {
  codigo: string;
  habilitado: boolean;
}

export interface MeResponse {
  usuario: {
    id: string;
    email: string;
    nombre: string;
    apellido: string | null;
    esAdminPlataforma: boolean;
  };
  organizacion: { id: string; nombre: string; slug: string } | null;
  rol: 'PROPIETARIO' | 'ADMINISTRADOR' | 'USUARIO' | null;
  modulos: ModuloEstado[];
}

/** Devuelve null si no hay sesión o el access token expiró (el layout protegido decide redirigir). */
export async function getMe(): Promise<MeResponse | null> {
  try {
    return await apiFetch<MeResponse>('/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
