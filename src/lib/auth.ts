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
    telefono: string | null;
    esAdminPlataforma: boolean;
  };
  organizacion: { id: string; nombre: string; slug: string } | null;
  rol: 'PROPIETARIO' | 'ADMINISTRADOR' | 'USUARIO' | null;
  modulos: ModuloEstado[];
}

/** Red caída, timeout o API inaccesible (no es falta de sesión). */
export function isBackendUnavailable(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 0 || error.status === 408);
}

export type MeSafeResult =
  | { status: 'ok'; me: MeResponse }
  | { status: 'unauthenticated' }
  | { status: 'unavailable'; message: string };

/**
 * Variante para layouts/páginas raíz: no lanza por red/timeout
 * (evita 500 y digests; el caller muestra BackendUnavailable o login).
 */
export async function getMeSafe(): Promise<MeSafeResult> {
  try {
    const me = await apiFetch<MeResponse>('/me');
    return { status: 'ok', me };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { status: 'unauthenticated' };
    }
    if (isBackendUnavailable(error)) {
      return { status: 'unavailable', message: error.message };
    }
    throw error;
  }
}

/** Devuelve null si no hay sesión o el access token expiró (el layout protegido decide redirigir).
 * Errores de red/timeout se relanzan — preferir `getMeSafe` en layouts. */
export async function getMe(): Promise<MeResponse | null> {
  const result = await getMeSafe();
  if (result.status === 'ok') return result.me;
  if (result.status === 'unauthenticated') return null;
  throw new ApiError(0, result.message);
}
