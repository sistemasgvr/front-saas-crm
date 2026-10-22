"use client";

import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => {};

/** true en el navegador y false en el render del servidor: para portales y
 * APIs del DOM sin desajuste de hidratación (reemplaza el patrón
 * `useEffect(() => setListo(true), [])`). */
export function useEsCliente(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}
