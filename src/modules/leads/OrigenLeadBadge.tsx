import { Icon } from "@/src/components/ui/Icon";

export const ORIGENES_LEAD = ["META", "WHATSAPP", "MANUAL"] as const;
export type OrigenLead = (typeof ORIGENES_LEAD)[number];

export const ETIQUETA_ORIGEN_LEAD: Record<OrigenLead, string> = {
  META: "Meta",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
};

const ICONO_ORIGEN: Record<OrigenLead, string> = {
  META: "mdi:facebook",
  WHATSAPP: "mdi:whatsapp",
  MANUAL: "mdi:pencil-outline",
};

function normalizarOrigen(origen: string | null | undefined): OrigenLead {
  if (origen === "META" || origen === "WHATSAPP" || origen === "MANUAL") {
    return origen;
  }
  return "MANUAL";
}

/** Badge compacto Meta / WhatsApp / Manual. */
export default function OrigenLeadBadge({
  origen,
  className = "",
  soloIcono = false,
}: {
  origen: string | null | undefined;
  className?: string;
  /** Solo el icono (tooltip con la etiqueta) — útil en listas densas como chats. */
  soloIcono?: boolean;
}) {
  const codigo = normalizarOrigen(origen);
  const esWhatsApp = codigo === "WHATSAPP";
  const etiqueta = ETIQUETA_ORIGEN_LEAD[codigo];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
        soloIcono ? "px-1" : ""
      } ${
        esWhatsApp
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : codigo === "META"
            ? "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400"
            : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
      } ${className}`}
      title={`Origen: ${etiqueta}`}
    >
      <Icon name={ICONO_ORIGEN[codigo]} size={12} className="shrink-0" />
      {soloIcono ? null : etiqueta}
    </span>
  );
}
