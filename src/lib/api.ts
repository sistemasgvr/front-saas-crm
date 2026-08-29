import { getAccessToken } from './session';
import { getApiUrl } from './api-url';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Timeout por defecto para llamadas al backend. Sin esto, un backend caído,
 * un cold-start de Neon, o una llamada a Graph API de Meta que nunca responde
 * dejaban el fetch colgado para siempre — sin error, sin timeout, sin
 * feedback — y con eso cualquier navegación (Server Component esperando el
 * fetch) o mutación (overlay global "Procesando…") se quedaba "cargando"
 * indefinidamente. Los endpoints que sí tardan de verdad (sync/backfill con
 * Meta) pasan su propio `timeoutMs` más alto — ver settings/meta/actions.ts.
 */
const TIMEOUT_DEFAULT_MS = 20_000;

function señalConTimeout(timeoutMs: number, externa?: AbortSignal | null): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return externa ? AbortSignal.any([externa, timeout]) : timeout;
}

async function parseError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  if (!body?.message) return res.statusText;
  return Array.isArray(body.message) ? body.message.join(', ') : body.message;
}

/** Un fetch que nunca resuelve rechaza por el AbortSignal, no por un status
 * HTTP — lo normalizamos a un ApiError legible en vez de dejar pasar el
 * DOMException crudo ("The operation was aborted"). */
function normalizarErrorDeRed(error: unknown): ApiError {
  if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return new ApiError(408, 'El servidor no respondió a tiempo. Intenta de nuevo.');
  }
  return new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
}

export interface FetchOptions extends RequestInit {
  /** Milisegundos antes de abortar la solicitud (default 20s). Súbelo para
   * operaciones que se sabe que tardan, como sincronizar con Meta. */
  timeoutMs?: number;
}

/** fetch público, sin token — usado por login. */
export async function publicFetch(path: string, init?: FetchOptions): Promise<Response> {
  const { timeoutMs = TIMEOUT_DEFAULT_MS, signal, ...rest } = init ?? {};
  try {
    return await fetch(`${getApiUrl()}${path}`, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...rest.headers },
      cache: 'no-store',
      signal: señalConTimeout(timeoutMs, signal),
    });
  } catch (error) {
    throw normalizarErrorDeRed(error);
  }
}

/**
 * fetch autenticado para Server Components (solo lectura de cookies).
 * Si el access token expiró, lanza ApiError(401) — quien llama decide
 * (normalmente: redirect a /login). El refresh en sí solo puede ejecutarse
 * desde un Server Action/Route Handler, que sí puede escribir cookies.
 */
export async function apiFetch<T>(path: string, init?: FetchOptions): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new ApiError(401, 'Sin sesión activa');
  }

  const { timeoutMs = TIMEOUT_DEFAULT_MS, signal, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...rest.headers,
      },
      cache: 'no-store',
      signal: señalConTimeout(timeoutMs, signal),
    });
  } catch (error) {
    throw normalizarErrorDeRed(error);
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
