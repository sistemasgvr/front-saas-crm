import type { Metadata } from "next";
import Link from "next/link";
import { getApiUrl } from "@/src/lib/api-url";

export const metadata: Metadata = {
  title: "Estado de eliminación de datos | CRM",
};

type EstadoResp = {
  confirmationCode: string;
  estado: string;
  tipo: string;
  detalle: string | null;
  fechaCreacion: string;
  fechaProcesada: string | null;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  PROCESADA: "Completada",
  NO_ENCONTRADA: "Sin datos asociados",
  PENDIENTE: "Pendiente",
};

async function cargarEstado(codigo: string): Promise<EstadoResp | null> {
  try {
    const res = await fetch(
      `${getApiUrl()}/meta/data-deletion/status/${encodeURIComponent(codigo)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as EstadoResp;
  } catch {
    return null;
  }
}

function formatearFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function EstadoEliminacionPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const estado = await cargarEstado(codigo);

  return (
    <article className="space-y-6 text-theme-sm text-gray-700 dark:text-gray-300">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Estado de tu solicitud
        </h1>
        <p className="mt-2 text-theme-xs text-gray-500">Código: {codigo}</p>
      </div>

      {!estado ? (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200">
          <p className="font-medium">No encontramos esta solicitud</p>
          <p className="mt-1 text-theme-xs opacity-90">
            Verifica el código o vuelve a solicitar la eliminación desde Facebook. Si el problema
            continúa, escribe a sistemas.gvrpe@gmail.com.
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <dl className="space-y-3">
            <div>
              <dt className="text-theme-xs text-gray-500">Estado</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {ETIQUETA_ESTADO[estado.estado] ?? estado.estado}
              </dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-500">Tipo</dt>
              <dd>{estado.tipo === "DEAUTHORIZE" ? "Deautorización de la app" : "Eliminación de datos"}</dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-500">Detalle</dt>
              <dd>{estado.detalle ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-500">Registrada</dt>
              <dd>{formatearFecha(estado.fechaCreacion)}</dd>
            </div>
            <div>
              <dt className="text-theme-xs text-gray-500">Procesada</dt>
              <dd>{formatearFecha(estado.fechaProcesada)}</dd>
            </div>
          </dl>
        </div>
      )}

      <p>
        <Link href="/eliminacion-datos" className="text-brand-600 underline dark:text-brand-400">
          ← Volver a instrucciones de eliminación
        </Link>
      </p>
    </article>
  );
}
