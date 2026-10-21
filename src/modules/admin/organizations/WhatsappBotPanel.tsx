"use client";
import { usePaginationPage } from "@/src/components/ui/use-pagination-page";
import Pagination from "@/src/components/ui/Pagination";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import { queryKeys } from "@/src/lib/query/keys";
import {
  resolverControl,
  nombreControl,
} from "@/src/modules/chats/control-types";
import {
  getBotOrganizacion,
  getBotHistorial,
  actualizarBotOrganizacion,
} from "./bot-actions";
import ModalHeading from "@/src/components/ui/modal/ModalHeading";
import type { BotOrganizacion } from "./bot-types";

export default function WhatsappBotPanel({
  id,
  activa,
  whatsappHabilitado,
  automatizacionesHabilitado,
}: {
  id: string;
  activa: boolean;
  whatsappHabilitado: boolean;
  automatizacionesHabilitado: boolean;
}) {
  const cache = useQueryClient();
  const [historyPage, setHistoryPage] = usePaginationPage(id);
  const [objetivo, setObjetivo] = useState<boolean | null>(null);
  const [motivo, setMotivo] = useState("");
  const [versionConfirmacion, setVersionConfirmacion] = useState(0);
  const [verHistorial, setVerHistorial] = useState(false);
  const config = useQuery({
    queryKey: queryKeys.adminWhatsappBot(id),
    queryFn: async () => {
      const actual = resolverControl(await getBotOrganizacion(id));
      const previo = cache.getQueryData<BotOrganizacion>(
        queryKeys.adminWhatsappBot(id),
      );
      return previo && previo.configVersion > actual.configVersion
        ? previo
        : actual;
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (q) =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? q.state.data?.desactivacionPendiente
          ? 2000
          : 20000
        : false,
  });
  const historial = useQuery({
    queryKey: [...queryKeys.adminWhatsappBotHistorial(id), historyPage],
    queryFn: async () => resolverControl(await getBotHistorial(id, historyPage)),
    enabled: verHistorial,
    retry: false,
  });
  const actualizar = useMutation({
    mutationFn: async () => {
      if (!config.data || objetivo === null)
        throw new Error("Actualiza la configuración antes de continuar");
      return resolverControl(
        await actualizarBotOrganizacion(
          id,
          objetivo,
          versionConfirmacion,
          motivo.trim(),
        ),
      );
    },
    onSuccess: async (actual) => {
      await cache.cancelQueries({ queryKey: queryKeys.adminWhatsappBot(id) });
      cache.setQueryData<BotOrganizacion>(
        queryKeys.adminWhatsappBot(id),
        (previo) =>
          previo && previo.configVersion > actual.configVersion
            ? previo
            : actual,
      );
      setObjetivo(null);
      setMotivo("");
      void cache.invalidateQueries({
        queryKey: queryKeys.adminWhatsappBot(id),
      });
      void cache.invalidateQueries({ queryKey: queryKeys.whatsappChats });
      toast.success(
        actual.desactivacionPendiente
          ? "Bot deshabilitado; aún hay envíos anteriores en curso"
          : actual.habilitado
            ? "Bot habilitado para la empresa"
            : "Bot deshabilitado para la empresa",
      );
    },
    onError: () => {
      setObjetivo(null);
      void cache.invalidateQueries({
        queryKey: queryKeys.adminWhatsappBot(id),
      });
    },
    meta: { silent: true },
  });
  const c = config.data;
  const puedeHabilitar =
    activa &&
    whatsappHabilitado &&
    automatizacionesHabilitado &&
    !c?.desactivacionPendiente;
  return (
    <section
      className="rounded-lg bg-gray-50/70 px-3 py-2 dark:bg-white/[0.02] text-gray-800 dark:text-gray-100"
      aria-label="Bot de WhatsApp por empresa"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon name="mdi:robot-outline" size={18} />
        <h2 className="text-sm font-medium">Bot de WhatsApp</h2>
        {c && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.habilitado && automatizacionesHabilitado && whatsappHabilitado ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
            <Icon name={c.habilitado ? "mdi:check-circle-outline" : "mdi:minus-circle-outline"} size={13} />
            {c.habilitado
              ? automatizacionesHabilitado && whatsappHabilitado
                ? "Permitido"
                : "Módulo inactivo"
              : "No permitido"}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {c && (
            <Button
              size="sm"
              startIcon={<Icon name={c.habilitado ? "mdi:shield-off-outline" : "mdi:shield-check-outline"} size={16} />}
              variant="outline"
              disabled={
                actualizar.isPending || (!c.habilitado && !puedeHabilitar)
              }
              onClick={() => {
                setMotivo("");
                setVersionConfirmacion(c.configVersion);
                setObjetivo(!c.habilitado);
              }}
            >
              {c.habilitado ? "Retirar permiso" : "Permitir bot"}
            </Button>
          )}
          <button
            type="button"
            aria-label="Historial de permisos del bot"
            title="Historial"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:bg-white/10"
            onClick={() => setVerHistorial(true)}
          >
            <Icon name="mdi:history" size={18} />
          </button>
        </div>
      </div>
      {config.isLoading && (
        <p role="status" className="text-xs">
          Cargando…
        </p>
      )}
      {config.isError && (
        <button
          type="button"
          className="text-xs text-error-600"
          onClick={() => void config.refetch()}
        >
          No disponible · Reintentar
        </button>
      )}
      {c && !c.habilitado && !puedeHabilitar && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
          {!activa
            ? "Empresa inactiva"
            : !whatsappHabilitado
              ? "Activa WhatsApp"
              : !automatizacionesHabilitado
                ? "Activa Automatizaciones"
                : "Hay envíos pendientes"}
        </p>
      )}
      {!!c?.despachosEnCurso && (
        <p role="status" className="mt-1 text-xs text-amber-700 dark:text-amber-300">
          {c.despachosEnCurso} envío(s) pendientes
        </p>
      )}
      <Modal
        open={verHistorial}
        onClose={() => setVerHistorial(false)}
        className="max-w-lg"
        header={
          <ModalHeading title="Historial de permisos" icon="mdi:history" />
        }
      >
        <div className="max-h-96 overflow-y-auto p-5">
          {historial.isLoading ? (
            <p role="status">Cargando…</p>
          ) : historial.isError ? (
            <button onClick={() => void historial.refetch()}>Reintentar</button>
          ) : historial.data?.data.length ? (
            <>
            <ol className="divide-y divide-gray-100 dark:divide-gray-800">
              {historial.data.data.map((e) => (
                <li key={e.id} className="flex items-start gap-3 py-3 text-xs">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${e.habilitadoNuevo ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}><Icon name={e.habilitadoNuevo ? "mdi:shield-check-outline" : "mdi:shield-off-outline"} size={16} /></span>
                  <div className="min-w-0"><p className="font-medium">
                    {e.habilitadoNuevo
                      ? "Permiso concedido"
                      : "Permiso retirado"}
                  </p>
                  <p className="mt-1 break-words text-gray-600 dark:text-gray-300">{e.motivo}</p>
                  <p className="mt-1 text-gray-500 dark:text-gray-400">
                    {e.usuario ? nombreControl(e.usuario) : "Plataforma"} ·{" "}
                    {new Date(e.creadoEn).toLocaleString("es-PE", {
                      timeZone: "America/Lima",
                    })}
                  </p></div>
                </li>
              ))}
            </ol>
            <Pagination {...historial.data} onPageChange={setHistoryPage} itemLabel="eventos" />
            </>
          ) : (
            <p className="text-sm">Sin cambios registrados.</p>
          )}
        </div>
      </Modal>
      <Modal
        open={objetivo !== null}
        onClose={() => {
          if (!actualizar.isPending) setObjetivo(null);
        }}
        header={
          <ModalHeading title={objetivo ? "Permitir bot" : "Retirar permiso del bot"} icon={objetivo ? "mdi:shield-check-outline" : "mdi:shield-off-outline"} danger={!objetivo} />
        }
        className="max-w-lg"
      >
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (c?.configVersion !== versionConfirmacion) {
              toast.error(
                "La configuración cambió. Cierra y revisa el estado actualizado.",
              );
              return;
            }
            if (
              motivo.trim().length >= 8 &&
              motivo.trim().length <= 500 &&
              !actualizar.isPending
            )
              actualizar.mutate();
          }}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {objetivo
              ? "Los chats bajo control humano se mantienen así. Los chats manuales no se activan automáticamente."
              : "Se bloquearán las nuevas respuestas del bot. Los envíos ya iniciados podrían terminar. Los asesores y la agenda siguen funcionando."}
          </p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo del cambio
            <textarea
              required
              minLength={8}
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={actualizar.isPending}
              className="mt-2 min-h-24 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500"
              placeholder="Indica el motivo (8 a 500 caracteres)"
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" disabled={actualizar.isPending} onClick={() => setObjetivo(null)}>Cancelar</Button>
          <Button
            size="sm"
            startIcon={<Icon name={objetivo ? "mdi:shield-check-outline" : "mdi:shield-off-outline"} size={16} />}
            type="submit"
            variant={objetivo ? "primary" : "danger"}
            loading={actualizar.isPending}
            disabled={
              config.isError ||
              motivo.trim().length < 8 ||
              motivo.trim().length > 500 ||
              (!!objetivo && !puedeHabilitar)
            }
          >
            {objetivo ? "Permitir bot" : "Retirar permiso"}
          </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
