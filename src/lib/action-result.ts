/**
 * Resultado de Server Actions que no deben `throw` hacia el cliente.
 * En producción Next/React ocultan el mensaje real (#441 / digest);
 * devolver `{ ok, error }` mantiene el texto usable en toasts.
 *
 * Importante: este módulo no debe depender de `api`/`session` (solo servidor)
 * porque `unwrapAction` se usa desde Client Components.
 */
export type ActionResult<T = void> =
  | (T extends void ? { ok: true; data?: undefined } : { ok: true; data: T })
  | { ok: false; error: string };

export function actionOk(): { ok: true };
export function actionOk<T>(data: T): { ok: true; data: T };
export function actionOk<T>(data?: T) {
  return data === undefined ? { ok: true as const } : { ok: true as const, data };
}

export function actionErr(
  error: unknown,
  fallback: string,
): { ok: false; error: string } {
  const message =
    error instanceof Error && error.message.trim() ? error.message.trim() : "";
  return {
    ok: false,
    error: message || fallback,
  };
}

/** Para mutationFn: convierte fallo serializado en Error legible en el cliente. */
export function unwrapAction<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return (result as { ok: true; data: T }).data;
}
