"use client";
import { useState, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import Select from "@/src/components/form/Select";
import ModalHeading from "@/src/components/ui/modal/ModalHeading";
import { queryKeys } from "@/src/lib/query/keys";
import { canManageOrganization } from "@/src/lib/roles";
import { getBotPreferencias } from "@/src/modules/settings/automations/bot-actions";
import type { ConversacionResumen } from "./types";
import {
  getHistorialControlAction,
  getAsesoresControlAction,
  tomarControlAction,
  transferirControlAction,
  asignarBotAction,
  asumirHumanoAction,
} from "./control-actions";
import {
  etiquetasControl,
  motivosControl,
  nombreControl,
  puedeOperarControl,
  resolverControl,
  ErrorControl,
  type EstadoControl,
} from "./control-types";

const fecha = (s: string) =>
  new Date(s).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
export function ControlBadge({
  modo,
  asignado = false,
}: {
  modo?: keyof typeof etiquetasControl;
  asignado?: boolean;
}) {
  modo = modo ?? (asignado ? "MANUAL" : undefined);
  if (!modo || (modo === "MANUAL" && !asignado)) return null;
  const color =
    modo === "BOT_ACTIVO"
      ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
      : ["TOMANDO_CONTROL", "ESPERANDO_HUMANO", "PAUSADO"].includes(modo)
        ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${color}`}
    >
      <Icon
        name={
          modo === "BOT_ACTIVO" ? "mdi:robot-outline" : "mdi:account-outline"
        }
        size={12}
      />
      {etiquetasControl[modo]}
    </span>
  );
}

export default function ChatControlPanel({
  id,
  chat,
  usuarioId,
  rol,
  query,
  renderOpciones,
  cerrarOpciones,
}: {
  id: string;
  chat: ConversacionResumen;
  usuarioId: string;
  rol: string | null;
  query: UseQueryResult<EstadoControl, Error>;
  renderOpciones: (items: ReactNode) => ReactNode;
  cerrarOpciones: () => void;
}) {
  const cache = useQueryClient();
  const [modal, setModal] = useState<
    "detalle" | "tomar" | "humano" | "transferir" | "historial" | "bot" | null
  >(null);
  const [destino, setDestino] = useState("");
  const [version, setVersion] = useState(0);
  const [asignadoEsperado, setAsignadoEsperado] = useState<string | null>(null);
  const c = query.data;
  const permiso = puedeOperarControl(
    c,
    usuarioId,
    canManageOrganization(rol),
    chat.lead?.asignadoUsuarioId,
  );
  const preferencias = useQuery({
    queryKey: queryKeys.whatsappBotPreferencias,
    queryFn: async () => resolverControl(await getBotPreferencias()),
    retry: false,
    staleTime: 10000,
    refetchOnWindowFocus: "always",
  });
  const historial = useQuery({
    queryKey: queryKeys.whatsappControlHistorial(id),
    queryFn: async () => resolverControl(await getHistorialControlAction(id)),
    enabled: modal === "historial",
    retry: false,
  });
  const asesores = useQuery({
    queryKey: queryKeys.whatsappControlAsesores(id),
    queryFn: async () => resolverControl(await getAsesoresControlAction(id)),
    enabled: modal === "transferir",
    retry: false,
    staleTime: 0,
  });
  const refrescar = () => {
    void cache.invalidateQueries({ queryKey: queryKeys.whatsappChat(id) });
    void cache.invalidateQueries({ queryKey: queryKeys.whatsappChats });
    void cache.invalidateQueries({ queryKey: queryKeys.leadsAll });
    if (chat.lead?.id)
      void cache.invalidateQueries({ queryKey: queryKeys.lead(chat.lead.id) });
    void cache.invalidateQueries({
      queryKey: queryKeys.whatsappBotPreferencias,
    });
  };
  const cambio = useMutation({
    mutationFn: async (accion: "tomar" | "humano" | "transferir" | "bot") => {
      if (!c || query.isError)
        throw new Error("Actualiza la atención antes de continuar");
      return resolverControl(
        await (accion === "tomar"
          ? tomarControlAction(id, version)
          : accion === "humano"
            ? asumirHumanoAction(id, version, asignadoEsperado)
            : accion === "bot"
              ? asignarBotAction(id, version)
              : transferirControlAction(id, version, destino)),
      );
    },
    onSuccess: async (actual) => {
      await cache.cancelQueries({ queryKey: queryKeys.whatsappControl(id) });
      cache.setQueryData<EstadoControl>(
        queryKeys.whatsappControl(id),
        (previo) =>
          previo && previo.controlVersion > actual.controlVersion
            ? previo
            : actual,
      );
      setModal(null);
      refrescar();
      toast.success(
        actual.modoAtencion === "TOMANDO_CONTROL"
          ? "Esperando que termine un envío anterior"
          : actual.modoAtencion === "BOT_ACTIVO"
            ? "Chat asignado al bot"
            : "Atención humana actualizada",
      );
    },
    onError: (e) => {
      refrescar();
      if (e instanceof ErrorControl && e.status === 409) setModal(null);
    },
    meta: { silent: true },
  });
  const abrir = (m: typeof modal) => {
    cerrarOpciones();
    setVersion(c?.controlVersion ?? 0);
    setAsignadoEsperado(chat.lead?.asignadoUsuarioId ?? null);
    setDestino("");
    setModal(m);
  };
  const puedeTomar =
    permiso &&
    !!c &&
    ["BOT_ACTIVO", "ESPERANDO_HUMANO", "PAUSADO"].includes(c.modoAtencion);
  const puedeTransferir = permiso && c?.modoAtencion === "HUMANO_ACTIVO";
  const humano = !!c && ["MANUAL", "HUMANO_ACTIVO"].includes(c.modoAtencion);
  const otroAsesor =
    !!(c?.controlUsuarioId && c.controlUsuarioId !== usuarioId) ||
    !!(
      chat.lead?.asignadoUsuarioId && chat.lead.asignadoUsuarioId !== usuarioId
    );
  const puedeAsumirHumano =
    permiso && humano && otroAsesor && canManageOrganization(rol);
  const botDisponible =
    !!preferencias.data?.autorizado &&
    !!preferencias.data.integracion.operativa;
  const puedeBot =
    permiso &&
    c?.modoAtencion !== "BOT_ACTIVO" &&
    c?.modoAtencion !== "TOMANDO_CONTROL" &&
    !chat.bloqueado &&
    botDisponible &&
    !preferencias.isError;
  const pendiente = c?.modoAtencion === "TOMANDO_CONTROL";
  const incidencias = c?.intentos.length ?? 0;
  const etiqueta = query.isError
    ? "Sin verificar"
    : !c
      ? "Consultando"
      : pendiente
        ? "En espera"
        : c.modoAtencion === "BOT_ACTIVO"
          ? "Bot"
          : c.modoAtencion === "ESPERANDO_HUMANO"
            ? "Pendiente"
            : c.modoAtencion === "PAUSADO"
              ? "Pausado"
              : c.modoAtencion === "CERRADO"
                ? "Cerrado"
                : "Humano";
  const titulo = c?.responsable
    ? `Atiende ${nombreControl(c.responsable)}`
    : c?.modoAtencion === "BOT_ACTIVO"
      ? "Atiende el bot"
      : chat.lead?.asignado
        ? `Atención humana · Asignado a ${chat.lead.asignado.nombre}`
        : "Atención del equipo humano";
  const iconClass =
    "hidden h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40 xl:flex dark:text-gray-400 dark:hover:bg-white/5";
  return (
    <>
      <div className="contents" aria-label="Control de atención">
        <button
          type="button"
          title={`${titulo}. Ver opciones de atención`}
          aria-label={`Atención: ${etiqueta}. Ver opciones`}
          onClick={() => abrir("detalle")}
          className={`inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-medium ${query.isError || pendiente || incidencias ? "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" : c?.modoAtencion === "BOT_ACTIVO" ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"}`}
        >
          <Icon
            name={
              query.isError || incidencias
                ? "mdi:alert-circle-outline"
                : pendiente
                  ? "mdi:progress-clock"
                  : c?.modoAtencion === "BOT_ACTIVO"
                    ? "mdi:robot-outline"
                    : "mdi:account-outline"
            }
            size={14}
          />
          {etiqueta}
          {incidencias > 0 && (
            <span className="text-[10px]">· {incidencias}</span>
          )}
        </button>
        {puedeTomar && (
          <button
            type="button"
            className={iconClass}
            title="Atender yo"
            aria-label="Atender yo"
            disabled={cambio.isPending || query.isError}
            onClick={() => abrir("tomar")}
          >
            <Icon name="mdi:hand-front-right-outline" size={20} />
          </button>
        )}
        {puedeAsumirHumano && (
          <button
            type="button"
            className={iconClass}
            title="Tomar chat del asesor"
            aria-label="Tomar chat del asesor"
            disabled={cambio.isPending || query.isError}
            onClick={() => abrir("humano")}
          >
            <Icon name="mdi:hand-front-left-outline" size={20} />
          </button>
        )}
        {c?.modoAtencion !== "BOT_ACTIVO" && preferencias.data?.autorizado && (
          <button
            type="button"
            className={iconClass}
            title={
              puedeBot
                ? "Asignar al bot"
                : !botDisponible
                  ? "Bot pendiente de conexión por la plataforma"
                  : "No tienes permiso para asignar el bot"
            }
            aria-label="Asignar al bot"
            disabled={!puedeBot || cambio.isPending}
            onClick={() => abrir("bot")}
          >
            <Icon name="mdi:robot-outline" size={20} />
          </button>
        )}
        {puedeTransferir && (
          <button
            type="button"
            className={iconClass}
            title="Transferir atención"
            aria-label="Transferir atención"
            disabled={cambio.isPending || query.isError}
            onClick={() => abrir("transferir")}
          >
            <Icon name="mdi:account-switch-outline" size={20} />
          </button>
        )}
        <button
          type="button"
          className={iconClass}
          title="Historial de atención"
          aria-label="Historial de atención"
          onClick={() => abrir("historial")}
        >
          <Icon name="mdi:history" size={20} />
        </button>
        {renderOpciones(
          <>
            {puedeAsumirHumano && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5"
                disabled={cambio.isPending || query.isError}
                onClick={() => abrir("humano")}
              >
                <Icon name="mdi:hand-front-left-outline" size={18} />
                Tomar chat del asesor
              </button>
            )}
            {puedeTomar && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5"
                disabled={cambio.isPending || query.isError}
                onClick={() => abrir("tomar")}
              >
                <Icon name="mdi:hand-front-right-outline" size={18} />
                Atender yo
              </button>
            )}
            {c?.modoAtencion !== "BOT_ACTIVO" &&
              preferencias.data?.autorizado && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-white/5"
                  disabled={!puedeBot || cambio.isPending}
                  title={
                    !botDisponible
                      ? "Bot pendiente de activación"
                      : "Asignar al bot"
                  }
                  onClick={() => abrir("bot")}
                >
                  <Icon name="mdi:robot-outline" size={18} />
                  Asignar al bot
                </button>
              )}
            {puedeTransferir && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5"
                disabled={cambio.isPending || query.isError}
                onClick={() => abrir("transferir")}
              >
                <Icon name="mdi:account-switch-outline" size={18} />
                Transferir atención
              </button>
            )}
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/5"
              onClick={() => abrir("historial")}
            >
              <Icon name="mdi:history" size={18} />
              Historial de atención
            </button>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
          </>,
        )}
      </div>
      <Modal
        open={modal !== null}
        onClose={() => {
          if (!cambio.isPending) setModal(null);
        }}
        header={
          <ModalHeading icon={modal === "historial" ? "mdi:history" : modal === "bot" ? "mdi:robot-outline" : modal === "transferir" ? "mdi:account-switch-outline" : "mdi:hand-back-right-outline"} title={modal === "detalle"
              ? "Atención del chat"
              : modal === "humano"
                ? "Tomar chat del asesor"
                : modal === "tomar"
                  ? "Atender esta conversación"
                  : modal === "bot"
                    ? "Asignar conversación al bot"
                    : modal === "transferir"
                      ? "Transferir atención"
                      : "Historial de atención"} />
        }
        footer={modal === "humano" || modal === "tomar" || modal === "bot" || modal === "transferir" ? (
          <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
            <Button size="sm" variant="outline" disabled={cambio.isPending} onClick={() => setModal(null)}>Cancelar</Button>
            <Button size="sm" startIcon={<Icon name="mdi:check" size={16} />} loading={cambio.isPending}
              disabled={query.isError || (modal === "humano" ? !puedeAsumirHumano : modal === "tomar" ? !puedeTomar : modal === "bot" ? !puedeBot : !destino || !puedeTransferir || asesores.isError)}
              onClick={() => cambio.mutate(modal)}>
              {modal === "humano" ? "Confirmar toma del chat" : modal === "tomar" ? "Confirmar atención humana" : modal === "bot" ? "Confirmar asignación al bot" : "Confirmar transferencia"}
            </Button>
          </div>
        ) : modal === "detalle" && c && !query.isError ? (
                <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
                  {puedeAsumirHumano && (
                    <Button size="sm" startIcon={<Icon name="mdi:hand-back-right-outline" size={16} />} onClick={() => abrir("humano")}>
                      Tomar chat del asesor
                    </Button>
                  )}
                  {puedeTomar && (
                    <Button size="sm" startIcon={<Icon name="mdi:account-check-outline" size={16} />} onClick={() => abrir("tomar")}>
                      Atender yo
                    </Button>
                  )}
                  {puedeBot && (
                    <Button
                      size="sm"
                      variant="outline"
                      startIcon={<Icon name="mdi:robot-outline" size={16} />}
                      onClick={() => abrir("bot")}
                    >
                      Asignar al bot
                    </Button>
                  )}
                  {puedeTransferir && (
                    <Button
                      size="sm"
                      variant="outline"
                      startIcon={<Icon name="mdi:account-switch-outline" size={16} />}
                      onClick={() => abrir("transferir")}
                    >
                      Transferir
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    startIcon={<Icon name="mdi:history" size={16} />}
                      onClick={() => abrir("historial")}
                  >
                    Historial
                  </Button>
                </div>
        ) : undefined}
        className="max-w-xl"
      >
        <div className="space-y-4 p-5 text-sm text-gray-700 dark:text-gray-300">
          {modal === "detalle" &&
            (query.isError ? (
              <div role="alert">
                <p>
                  No se pudo verificar quién atiende. Los envíos están
                  bloqueados hasta actualizar.
                </p>
                <Button variant="outline" onClick={() => void query.refetch()}>
                  Reintentar
                </Button>
              </div>
            ) : !c ? (
              <p role="status">Consultando atención…</p>
            ) : (
              <>
                <p className="font-medium">
                  {pendiente
                    ? "Esperando que termine un envío anterior del bot"
                    : titulo}
                </p>
                <p>
                  {pendiente
                    ? "La toma aún no está confirmada. Espera antes de responder desde WhatsApp."
                    : !permiso
                      ? "Este chat está en solo lectura para ti. El responsable o un administrador puede cambiar la atención."
                      : c.modoAtencion === "BOT_ACTIVO"
                        ? "Puedes continuar personalmente en cualquier momento. Tu primer mensaje válido cambia a atención humana."
                        : "La conversación ya está en atención humana."}
                </p>
                {c.controlTomadoEn && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Desde {fecha(c.controlTomadoEn)}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Los recordatorios de agenda continúan. El responsable de
                  atención y la asignación del lead son independientes.
                </p>
                {preferencias.data?.clientesHabilitados && !botDisponible && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {preferencias.isError
                      ? "No se pudo consultar la disponibilidad del bot."
                      : preferencias.data?.autorizado
                        ? "La plataforma aún debe conectar la atención automática."
                        : "El bot no está habilitado para esta empresa."}
                  </p>
                )}
                {incidencias > 0 && (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                    <p>
                      Hay envíos anteriores que requieren revisión. Podrían
                      llegar tarde; no los reenvíes sin comprobar su entrega.
                    </p>
                    <ul className="mt-2 space-y-1">
                      {c.intentos.map((i) => (
                        <li key={i.id}>
                          {i.actor === "BOT"
                            ? "Bot"
                            : i.actor === "SYSTEM"
                              ? "Agenda"
                              : "Asesor"}{" "}
                          ·{" "}
                          {i.estado === "INCIERTO"
                            ? "Entrega incierta"
                            : i.estado === "ACEPTADO"
                              ? "Aceptado, registro pendiente"
                              : "En curso"}{" "}
                          · {fecha(i.creadoEn)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </>
            ))}
          {modal === "tomar" && (
            <>
              <p>
                El bot dejará de responder y tú atenderás este chat. Si hay un
                envío anterior en curso, esperaremos antes de confirmar.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                La agenda y la asignación del lead se conservan. El bot solo
                podrá volver mediante una asignación explícita.
              </p>
            </>
          )}
          {modal === "humano" && (
            <>
              <p>
                Te encargarás de este chat
                {chat.lead?.asignado
                  ? ` en lugar de ${chat.lead.asignado.nombre}`
                  : ""}
                . El lead vinculado también quedará asignado a ti.
              </p>
            </>
          )}
          {modal === "bot" && (
            <>
              <p>
                El bot retomará la atención de este chat con el historial
                disponible. Esta decisión queda registrada; puedes volver a
                atenderlo personalmente cuando quieras.
              </p>
            </>
          )}
          {modal === "transferir" && (
            <>
              <p>
                El asesor elegido continuará la atención humana. La asignación
                del lead se conserva.
              </p>
              {asesores.isLoading ? (
                <p role="status">Consultando asesores…</p>
              ) : asesores.isError ? (
                <div role="alert">
                  <p>{asesores.error.message}</p>
                  <Button
                    variant="outline"
                    onClick={() => void asesores.refetch()}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="control-atencion-asesor" className="mb-2 block font-medium">Asesor</label>
                    <Select
                      id="control-atencion-asesor"
                      value={destino}
                      onChange={setDestino}
                      placeholder="Selecciona un asesor"
                      options={(asesores.data ?? []).map((p) => ({value: p.id, label: nombreControl(p)}))}
                      disabled={cambio.isPending}
                      required
                    />
                  </div>
                  {asesores.data?.length === 0 && (
                    <p>No hay otros miembros con permiso sobre este chat.</p>
                  )}
                </>
              )}
            </>
          )}
          {modal === "historial" &&
            (historial.isLoading ? (
              <p role="status">Consultando historial…</p>
            ) : historial.isError ? (
              <div role="alert">
                <p>{historial.error.message}</p>
                <Button
                  variant="outline"
                  onClick={() => void historial.refetch()}
                >
                  Reintentar
                </Button>
              </div>
            ) : historial.data?.length ? (
              <ol className="space-y-4">
                {historial.data.map((e) => (
                  <li
                    key={e.id}
                    className="border-b border-gray-100 pb-3 dark:border-gray-800"
                  >
                    <p className="font-medium">
                      {motivosControl[e.motivo] ?? etiquetasControl[e.modo]}
                    </p>
                    <p className="mt-1 text-xs">
                      {e.usuario
                        ? nombreControl(e.usuario)
                        : e.actor === "SYSTEM"
                          ? "Sistema"
                          : e.actor === "BOT"
                            ? "Bot"
                            : "Respuesta externa"}{" "}
                      · {fecha(e.creadoEn)}
                    </p>
                    {e.responsable && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Atiende: {nombreControl(e.responsable)}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p>No hay cambios de atención registrados.</p>
            ))}
        </div>
      </Modal>
    </>
  );
}
