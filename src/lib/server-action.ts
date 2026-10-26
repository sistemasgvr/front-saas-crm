import { unstable_rethrow } from "next/navigation";
import { actionErr, type ActionResult } from "./action-result";

/** Los errores de negocio cruzan RSC como datos; las redirecciones siguen su curso. */
export async function runAction<T>(
  action: () => Promise<T>,
  fallback = "No se pudo completar la acción. Intenta de nuevo.",
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await action() } as ActionResult<T>;
  } catch (error) {
    unstable_rethrow(error);
    return actionErr(error, fallback);
  }
}
