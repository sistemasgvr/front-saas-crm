import { claseEstadoGestion, etiquetaEstadoGestion } from "./pipeline";

/** Mismo look que el Badge genérico (forma/padding), pero con un color por
 * cada uno de los 12 estados del pipeline — el Badge compartido solo tiene
 * 7 colores fijos, no alcanzan para diferenciar cada etapa. */
export default function EstadoPipelineBadge({
  tipoLead,
  estado,
}: {
  tipoLead: string | null | undefined;
  estado: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${claseEstadoGestion(estado)}`}
    >
      {etiquetaEstadoGestion(tipoLead, estado)}
    </span>
  );
}
