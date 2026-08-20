import type { DynamicFilterValues } from "./types";

/**
 * Al cambiar un padre en la jerarquía, limpia los hijos para no dejar
 * combinaciones inválidas (p. ej. campaña de otra cuenta).
 */
export function aplicarCascadaFiltros(
  prev: DynamicFilterValues,
  next: DynamicFilterValues,
  cadenas: readonly (readonly string[])[],
): DynamicFilterValues {
  const result = { ...next };
  for (const cadena of cadenas) {
    for (let i = 0; i < cadena.length - 1; i += 1) {
      const padre = cadena[i];
      if ((prev[padre] ?? "") !== (result[padre] ?? "")) {
        for (let j = i + 1; j < cadena.length; j += 1) {
          delete result[cadena[j]];
        }
        break;
      }
    }
  }
  return result;
}

/** Jerarquía ads Meta: cuenta → campaña → conjunto → anuncio. */
export const CASCADA_META_ADS = [
  ["metaCuentaId", "campanaId", "conjuntoAnuncioId", "anuncioId"],
] as const;

/** Jerarquía leads: cuenta → campaña → anuncio; página → formulario. */
export const CASCADA_META_LEADS = [
  ["metaCuentaId", "campanaId", "anuncioId"],
  ["metaPaginaId", "formularioId"],
] as const;
