"use client";

import Badge from "@/src/components/ui/badge/Badge";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import { Icon } from "@/src/components/ui/Icon";
import type { ResultadoSaludWebhookWhatsapp } from "./actions";

type Nivel = "ok" | "info" | "advertencia" | "error";

interface Chequeo {
  id: string;
  nivel: Nivel;
  titulo: string;
  detalle?: string;
  /** Explicación técnica: va en el (?) para no saturar la tarjeta. */
  ayuda?: string;
  campos?: string[];
  /** true: los campos quedan detrás de "Ver campos". */
  camposPlegados?: boolean;
}

const ESTILO: Record<Nivel, { icono: string; color: string }> = {
  ok: { icono: "mdi:check-circle", color: "text-success-500" },
  info: { icono: "mdi:information", color: "text-blue-light-500" },
  advertencia: { icono: "mdi:alert", color: "text-warning-500" },
  error: { icono: "mdi:alert-circle", color: "text-error-500" },
};

/** Lo urgente primero. */
const ORDEN: Record<Nivel, number> = { error: 0, advertencia: 1, info: 2, ok: 3 };

const RUTA_WEBHOOKS =
  "En Meta Developers → tu app → Webhooks → WhatsApp Business Account, pulsa «Suscribirse» en cada campo.";

/** Códigos de health_status de Meta con explicación para el usuario. */
const ERRORES_ENVIO: Record<number, { titulo: string; detalle: string }> = {
  141006: {
    titulo: "Falta el método de pago",
    detalle: "Agrega o revisa el método de pago de la cuenta de WhatsApp en Meta Business.",
  },
  141007: {
    titulo: "Falta la zona horaria",
    detalle: "Configura la zona horaria de la cuenta de WhatsApp en Meta Business.",
  },
  138024: {
    titulo: "Llamadas por SIP no habilitadas",
    detalle: "Solo afecta llamadas por SIP; los mensajes funcionan con normalidad.",
  },
};

/** Los 138xxx son de la Calling API: no afectan mensajes. */
const esErrorDeLlamadas = (codigo: number | null) =>
  codigo !== null && codigo >= 138000 && codigo < 139000;

const fecha = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

function armarChequeos(r: ResultadoSaludWebhookWhatsapp, rolLinea: string | null | undefined): Chequeo[] {
  const chequeos: Chequeo[] = [];

  if (r.numero.estado === "DISCONNECTED") {
    chequeos.push({
      id: "numero",
      nivel: "error",
      titulo: "El número no está conectado a la API de WhatsApp",
      detalle: "WhatsApp Business puede seguir funcionando en el celular. Completa o restablece la conexión del mismo número con la plataforma de Meta.",
      ayuda: "Meta devuelve DISCONNECTED para la integración con su API; este estado no mide la conexión a internet del celular. La suscripción al webhook y el alta de coexistencia se comprueban por separado.",
    });
  }

  if (r.webhookSuscrito === false) {
    chequeos.push({
      id: "waba",
      nivel: "error",
      titulo: "La app no está suscrita a la cuenta de WhatsApp",
      detalle: "Pulsa «Re-suscribir webhook».",
    });
  }
  if (r.suscripcionAppActiva === false) {
    chequeos.push({
      id: "app",
      nivel: "error",
      titulo: "Webhook de WhatsApp inactivo en la app de Meta",
      ayuda: "En Meta Developers → tu app → Webhooks → WhatsApp Business Account, activa la suscripción y verifica la URL del webhook.",
    });
  }

  if (!r.camposVerificados) {
    chequeos.push({
      id: "campos",
      nivel: "info",
      titulo: "No se pudieron comprobar los campos del webhook",
      ayuda: "Hace falta el App Secret guardado en la conexión de Meta para leer la suscripción de la app.",
    });
  } else if (r.camposFaltantes.length > 0) {
    const n = r.camposFaltantes.length;
    chequeos.push({
      id: "campos",
      nivel: "advertencia",
      titulo: n === 1 ? "Falta suscribir 1 campo obligatorio" : `Faltan suscribir ${n} campos obligatorios`,
      detalle: "Sin ellos el CRM no recibe parte de los eventos de WhatsApp.",
      ayuda: `${RUTA_WEBHOOKS} account_update avisa si se desconecta la coexistencia.`,
      campos: r.camposFaltantes,
    });
  } else if (r.webhookSuscrito !== false && r.suscripcionAppActiva !== false) {
    chequeos.push({
      id: "campos",
      nivel: "ok",
      titulo: "Webhook completo",
      detalle: "Todos los campos obligatorios están suscritos.",
    });
  }

  const recomendados = r.camposRecomendadosFaltantes ?? [];
  if (r.camposVerificados && recomendados.length > 0) {
    chequeos.push({
      id: "recomendados",
      nivel: "info",
      titulo: `${recomendados.length} campos opcionales sin suscribir`,
      detalle: "Activan avisos de cuenta, plantillas, nombre, seguridad y preferencias de marketing.",
      ayuda: `Opcionales: el CRM ya los procesa si los activas. ${RUTA_WEBHOOKS}`,
      campos: recomendados,
      camposPlegados: true,
    });
  }

  if (r.numero.saludEnvio === "BLOCKED") {
    chequeos.push({
      id: "envio",
      nivel: "error",
      titulo: "Meta bloqueó el envío de mensajes",
      detalle: "Revisa los motivos debajo; la recepción se comprueba aparte.",
    });
  }
  r.erroresEnvio.forEach((error, index) => {
    const conocido = error.codigo !== null ? ERRORES_ENVIO[error.codigo] : undefined;
    const deLlamadas = esErrorDeLlamadas(error.codigo);
    chequeos.push({
      id: `envio-${error.codigo ?? "x"}-${index}`,
      // En una línea solo de mensajes, un error de llamadas es informativo.
      nivel: deLlamadas && (rolLinea ?? "MENSAJES") === "MENSAJES" ? "info" : "advertencia",
      titulo: conocido?.titulo ?? error.descripcion,
      detalle: conocido?.detalle ?? error.solucion ?? undefined,
      ayuda: `Código ${error.codigo ?? "—"} de Meta: ${error.descripcion}`,
    });
  });

  r.erroresVerificacion.forEach((mensaje, index) => {
    chequeos.push({ id: `verif-${index}`, nivel: "advertencia", titulo: mensaje });
  });

  return chequeos;
}

function FilaChequeo({ chequeo }: { chequeo: Chequeo }) {
  const estilo = ESTILO[chequeo.nivel];
  const chips = chequeo.campos?.length ? (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {chequeo.campos.map((campo) => (
        <code
          key={campo}
          className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 dark:bg-white/[0.06] dark:text-gray-300"
        >
          {campo}
        </code>
      ))}
    </div>
  ) : null;

  return (
    <li className="flex items-start gap-2.5 py-2.5">
      <Icon name={estilo.icono} size={18} className={`mt-px shrink-0 ${estilo.color}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{chequeo.titulo}</p>
          {chequeo.ayuda && <HelpTooltip content={chequeo.ayuda} align="end" />}
        </div>
        {chequeo.detalle && (
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">{chequeo.detalle}</p>
        )}
        {chips &&
          (chequeo.camposPlegados ? (
            <details className="group mt-1">
              <summary className="inline-flex cursor-pointer select-none items-center gap-0.5 text-theme-xs font-medium text-brand-500 hover:underline">
                Ver campos
                <Icon name="mdi:chevron-down" size={14} className="transition group-open:rotate-180" />
              </summary>
              {chips}
            </details>
          ) : (
            chips
          ))}
      </div>
    </li>
  );
}

/** Diagnóstico de la línea en una lista de chequeos: lo urgente arriba, el
 * detalle técnico en (?) y los campos opcionales plegados. */
export default function WhatsappEstadoConexion({
  resultado,
  consultando,
  fallo,
  rolLinea,
}: {
  resultado: ResultadoSaludWebhookWhatsapp | undefined;
  consultando: boolean;
  fallo: boolean;
  rolLinea: string | null | undefined;
}) {
  const chequeos = resultado ? armarChequeos(resultado, rolLinea) : [];
  chequeos.sort((a, b) => ORDEN[a.nivel] - ORDEN[b.nivel]);

  const hayError = fallo || chequeos.some((c) => c.nivel === "error");
  const hayAviso = chequeos.some((c) => c.nivel === "advertencia");
  const resumen = !resultado
    ? null
    : hayError
      ? { color: "error" as const, texto: "Requiere acción" }
      : hayAviso
        ? { color: "warning" as const, texto: "Revisar" }
        : { color: "success" as const, texto: "Todo en orden" };

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h4 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">Estado de la conexión</h4>
          <HelpTooltip
            content="Se consulta a Meta al abrir esta página y con «Verificar conexión». Que la suscripción esté bien no prueba la entrega: confírmala enviando un mensaje real al número."
            placement="bottom"
          />
        </div>
        {consultando ? (
          <span className="inline-flex items-center gap-1 text-theme-xs text-gray-500">
            <Icon name="mdi:loading" size={14} className="animate-spin" />
            Consultando Meta…
          </span>
        ) : resumen ? (
          <Badge color={resumen.color} size="sm">
            {resumen.texto}
          </Badge>
        ) : null}
      </div>

      {fallo ? (
        <p role="alert" className="mt-2 flex items-start gap-2 text-theme-xs text-error-600 dark:text-error-400">
          <Icon name="mdi:alert-circle" size={16} className="mt-px shrink-0" />
          No se pudo consultar Meta. El estado actual de la conexión no está verificado.
        </p>
      ) : chequeos.length > 0 ? (
        <ul className="mt-1 divide-y divide-gray-100 dark:divide-gray-800" aria-live="polite">
          {chequeos.map((chequeo) => (
            <FilaChequeo key={chequeo.id} chequeo={chequeo} />
          ))}
        </ul>
      ) : null}

      {resultado && (
        <p className="mt-2 border-t border-gray-100 pt-2 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          Último mensaje recibido:{" "}
          {resultado.ultimoMensajeEntranteEn ? fecha(resultado.ultimoMensajeEntranteEn) : "sin registro"}
          {" · "}Consultado: {fecha(resultado.verificadoEn)}
          {resultado.numero.plataforma && ` · ${resultado.numero.plataforma === "CLOUD_API" ? "Cloud API" : resultado.numero.plataforma}`}
        </p>
      )}
    </div>
  );
}
