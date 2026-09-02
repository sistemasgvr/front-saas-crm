"use client";

import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import Modal from "@/src/components/ui/modal/Modal";
import { ETIQUETA_TIPO_LEAD } from "./pipeline";
import { TIPOS_LEAD_INMOBILIARIA } from "./types";

const ICONO_TIPO_LEAD: Record<string, string> = {
  COMPRA: "mdi:home-search-outline",
  VENTA: "mdi:home-export-outline",
  OTRO: "mdi:dots-horizontal-circle-outline",
};

export default function ClasificarTipoLeadModal({
  open,
  nombreLead,
  destinoEtiqueta,
  loading,
  onElegir,
  onCancelar,
}: {
  open: boolean;
  nombreLead?: string | null;
  destinoEtiqueta?: string;
  loading?: boolean;
  onElegir: (tipo: string) => void;
  onCancelar: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancelar}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon name="mdi:tag-outline" size={22} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Clasifica el lead
              {nombreLead ? ` — ${nombreLead}` : ""}
            </h3>
            <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">
              Antes de avanzar{destinoEtiqueta ? ` a ${destinoEtiqueta}` : ""}, indica si es un lead de
              compra, venta u otro tipo.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TIPOS_LEAD_INMOBILIARIA.map((tipo) => (
            <button
              key={tipo}
              type="button"
              disabled={loading}
              onClick={() => onElegir(tipo)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-theme-sm font-medium text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200 dark:hover:border-brand-700 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
            >
              <Icon name={ICONO_TIPO_LEAD[tipo] ?? "mdi:circle-outline"} size={18} />
              {ETIQUETA_TIPO_LEAD[tipo] ?? tipo}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onCancelar} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
