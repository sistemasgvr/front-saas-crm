"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Avatar from "@/src/components/ui/avatar/Avatar";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";
import Select from "@/src/components/form/Select";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { enviarMensajeAction } from "./actions";
import { getChat, getTemplates } from "./queries";
import type { Mensaje } from "./types";

const INTERVALO_REFRESCO_MS = 10_000;

const ICONO_ESTADO: Record<string, string> = {
  enviado: "mdi:check",
  entregado: "mdi:check-all",
  leido: "mdi:check-all",
  fallido: "mdi:alert-circle-outline",
};

function estaDentroDeVentana(ventanaExpiraEn: string | null | undefined): boolean {
  return !!ventanaExpiraEn && new Date(ventanaExpiraEn).getTime() > Date.now();
}

function contarVariables(texto: string | undefined): number {
  if (!texto) return 0;
  const numeros = [...texto.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return numeros.length > 0 ? Math.max(...numeros) : 0;
}

function formatearHora(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  const esSaliente = mensaje.direccion === "saliente";
  return (
    <div className={`flex ${esSaliente ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-theme-sm ${
          esSaliente
            ? "bg-brand-500 text-white"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {mensaje.tipo === "template" && mensaje.plantillaNombre ? (
          <p className="mb-1 flex items-center gap-1 text-theme-xs opacity-80">
            <Icon name="mdi:script-text-outline" size={14} />
            Plantilla: {mensaje.plantillaNombre}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{mensaje.texto ?? "(sin texto)"}</p>
        <div className="mt-1 flex items-center justify-end gap-1 text-theme-xs opacity-70">
          {formatearHora(mensaje.fechaMensaje)}
          {esSaliente && mensaje.estadoEntrega && (
            <Icon name={ICONO_ESTADO[mensaje.estadoEntrega] ?? "mdi:clock-outline"} size={14} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatDetailView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState("");
  const [parametrosPlantilla, setParametrosPlantilla] = useState<string[]>([]);
  const finRef = useRef<HTMLDivElement>(null);

  const chatQuery = useQuery({
    queryKey: queryKeys.whatsappChat(id),
    queryFn: () => getChat(id),
    refetchInterval: INTERVALO_REFRESCO_MS,
  });

  const dentroDeVentana = estaDentroDeVentana(chatQuery.data?.ventanaExpiraEn);

  const templatesQuery = useQuery({
    queryKey: queryKeys.whatsappTemplates,
    queryFn: getTemplates,
    enabled: !dentroDeVentana,
  });

  const plantilla = templatesQuery.data?.find((p) => p.nombre === plantillaSeleccionada);
  const numVariables = contarVariables(plantilla?.cuerpoTexto);
  const parametrosCompletos = parametrosPlantilla.every((p) => p.trim().length > 0);

  const enviar = useAppMutation({
    mutationFn: async () => {
      if (dentroDeVentana) {
        await enviarMensajeAction(id, { texto });
      } else {
        if (!plantilla) throw new Error("Elige una plantilla aprobada");
        await enviarMensajeAction(id, {
          plantillaNombre: plantilla.nombre,
          plantillaIdioma: plantilla.idioma,
          parametros: numVariables > 0 ? parametrosPlantilla : undefined,
        });
      }
    },
    invalidateKeys: [queryKeys.whatsappChat(id), queryKeys.whatsappChats],
  });

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [chatQuery.data?.mensajes.length]);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.whatsappChats });
    };
  }, [queryClient]);

  if (chatQuery.isLoading) return <PageLoader />;
  if (chatQuery.isError) return <QueryError error={chatQuery.error} />;
  if (!chatQuery.data) return null;

  const chat = chatQuery.data;
  const nombre = chat.lead?.nombre ?? chat.nombreContacto ?? chat.waId;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[480px] flex-col space-y-4">
      <PageHeader
        title={nombre}
        description={`+${chat.waId}`}
        backHref="/chats"
        backLabel="Volver a Chats"
      />

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <Avatar name={nombre} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{nombre}</p>
            {chat.lead ? (
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">Lead vinculado</p>
            ) : (
              <p className="text-theme-xs text-warning-500">Sin lead vinculado</p>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {chat.mensajes.length === 0 ? (
            <p className="text-center text-theme-sm text-gray-500 dark:text-gray-400">
              Todavía no hay mensajes en esta conversación.
            </p>
          ) : (
            chat.mensajes.map((mensaje) => <Burbuja key={mensaje.id} mensaje={mensaje} />)
          )}
          <div ref={finRef} />
        </div>

        <div className="border-t border-gray-100 p-4 dark:border-gray-800">
          {dentroDeVentana ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (texto.trim()) {
                  enviar.mutate(undefined, { onSuccess: () => setTexto("") });
                }
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                placeholder="Escribe un mensaje…"
                rows={2}
                className="flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-theme-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
              />
              <Button type="submit" size="sm" loading={enviar.isPending} disabled={!texto.trim()}>
                Enviar
              </Button>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-theme-xs text-warning-500">
                <Icon name="mdi:clock-alert-outline" size={14} />
                Pasaron 24h desde el último mensaje del contacto — hace falta enviar una plantilla aprobada.
              </p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    options={(templatesQuery.data ?? []).map((t) => ({
                      value: t.nombre,
                      label: `${t.nombre} (${t.idioma})`,
                    }))}
                    placeholder={
                      templatesQuery.isLoading ? "Cargando plantillas…" : "Elige una plantilla aprobada"
                    }
                    value={plantillaSeleccionada}
                    onChange={(valor) => {
                      setPlantillaSeleccionada(valor);
                      const seleccionada = templatesQuery.data?.find((t) => t.nombre === valor);
                      setParametrosPlantilla(
                        Array(contarVariables(seleccionada?.cuerpoTexto)).fill(""),
                      );
                    }}
                  />
                </div>
                {numVariables === 0 && (
                  <Button
                    type="button"
                    size="sm"
                    loading={enviar.isPending}
                    disabled={!plantillaSeleccionada}
                    onClick={() =>
                      enviar.mutate(undefined, {
                        onSuccess: () => {
                          setPlantillaSeleccionada("");
                          setParametrosPlantilla([]);
                        },
                      })
                    }
                  >
                    Enviar plantilla
                  </Button>
                )}
              </div>
              {plantilla && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-theme-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                  {plantilla.cuerpoTexto}
                </p>
              )}
              {numVariables > 0 && (
                <div className="space-y-2">
                  {parametrosPlantilla.map((valor, i) => (
                    <Input
                      key={i}
                      placeholder={`Valor para {{${i + 1}}}`}
                      value={valor}
                      onChange={(e) =>
                        setParametrosPlantilla((prev) =>
                          prev.map((p, idx) => (idx === i ? e.target.value : p)),
                        )
                      }
                    />
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    loading={enviar.isPending}
                    disabled={!plantillaSeleccionada || !parametrosCompletos}
                    onClick={() =>
                      enviar.mutate(undefined, {
                        onSuccess: () => {
                          setPlantillaSeleccionada("");
                          setParametrosPlantilla([]);
                        },
                      })
                    }
                  >
                    Enviar plantilla
                  </Button>
                </div>
              )}
              {templatesQuery.data?.length === 0 && (
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  No hay plantillas aprobadas — créalas en Meta Business Suite primero.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
