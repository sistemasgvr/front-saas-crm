"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAutomationIntegration,
  guardarAutomationIntegration,
} from "./queries";
import type { AutomationIntegration } from "./integration-types";
import {
  resolverControl,
  ErrorControl,
} from "@/src/modules/chats/control-types";
import { Icon } from "@/src/components/ui/Icon";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import ModalHeading from "@/src/components/ui/modal/ModalHeading";
const key = ["admin", "automations", "integration"];
export default function AutomationIntegrationCard() {
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: key,
    queryFn: getAutomationIntegration,
    retry: false,
  });
  return (
    <div
      className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/5 text-gray-800 dark:text-gray-100"
      aria-label="Integración n8n de plataforma"
    >
      <span className="flex items-center gap-2 text-sm">
        <Icon name="mdi:lan-connect" size={18} />
        n8n{" "}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {q.isLoading
            ? "Cargando…"
            : q.isError
              ? "No disponible"
              : q.data?.configurada
                ? "Configurado · ejecución pendiente"
                : "Sin configurar"}
        </span>
      </span>
      <Button
        size="sm"
        startIcon={<Icon name={q.isError ? "mdi:refresh" : "mdi:cog-outline"} size={16} />}
        variant="outline"
        onClick={() => (q.isError ? void q.refetch() : setOpen(true))}
        disabled={q.isLoading}
      >
        {q.isError ? "Reintentar" : "Configurar"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="max-w-lg"
        header={<ModalHeading title="Conexión n8n" icon="mdi:lan-connect" />}
      >
        {q.data && (
          <IntegrationForm
            key={q.data.version}
            data={q.data}
            close={() => setOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
function IntegrationForm({
  data,
  close,
}: {
  data: AutomationIntegration;
  close: () => void;
}) {
  const cache = useQueryClient();
  const [url, setUrl] = useState(data.webhookUrl);
  const [header, setHeader] = useState(data.headerNombre);
  const [secret, setSecret] = useState("");
  const [remove, setRemove] = useState(false);
  const [visible, setVisible] = useState(false);
  const mutation = useMutation({
    mutationFn: async () =>
      resolverControl(
        await guardarAutomationIntegration({
          webhookUrl: url.trim(),
          headerNombre: header.trim(),
          version: data.version,
          ...(secret ? { secreto: secret } : {}),
          ...(remove ? { eliminarSecreto: true } : {}),
        }),
      ),
    onSuccess: async (value) => {
      await cache.cancelQueries({ queryKey: key });
      cache.setQueryData(key, value);
      setSecret("");
      close();
      toast.success("Conexión n8n guardada");
    },
    onError: (error) => {
      setSecret("");
      if (error instanceof ErrorControl && error.status === 409) {
        close();
        void cache.invalidateQueries({ queryKey: key });
      }
    },
    meta: { silent: true },
  });
  const inputClass =
    "mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500";
  return (
    <form
      className="space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <span className="flex items-center gap-2"><Icon name="mdi:link-variant" size={16} />URL del webhook</span>
        <input
          className={inputClass}
          type="url"
          required
          maxLength={2048}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://n8n.example.com/webhook/crm"
          disabled={mutation.isPending}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <span className="flex items-center gap-2"><Icon name="mdi:shield-key-outline" size={16} />Cabecera de autenticación</span>
        <input
          className={inputClass}
          required
          maxLength={100}
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          disabled={mutation.isPending}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <span className="flex items-center gap-2"><Icon name="mdi:key-outline" size={16} />Secreto</span>
        <span className="relative block">
        <input
          className={`${inputClass} pr-11`}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={16}
          maxLength={4096}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          disabled={remove || mutation.isPending}
          placeholder={
            data.credencialConfigurada
              ? "Guardado · dejar vacío para conservar"
              : "Sin configurar"
          }
        />
        <button type="button" aria-label={visible ? "Ocultar secreto" : "Mostrar secreto"} aria-pressed={visible} disabled={remove || mutation.isPending} onClick={() => setVisible(!visible)} className="absolute right-1 top-2 flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:bg-white/10"><Icon name={visible ? "mdi:eye-off-outline" : "mdi:eye-outline"} size={18} /></button>
        </span>
      </label>
      {data.credencialConfigurada && (
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-950"
            checked={remove}
            disabled={mutation.isPending}
            onChange={(e) => {
              setRemove(e.target.checked);
              setSecret("");
            }}
          />
          Eliminar secreto guardado
        </label>
      )}
      <p className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600 dark:bg-white/5 dark:text-gray-400">
        <Icon name="mdi:information-outline" size={16} />Configura la misma cabecera en n8n. Ejecución pendiente de Fase 2.
      </p>
      {mutation.isError && (
        <p role="alert" className="text-sm text-error-600">
          {mutation.error.message}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={close}>Cancelar</Button>
        <Button type="submit" size="sm" loading={mutation.isPending} startIcon={<Icon name="mdi:content-save-outline" size={16} />}>Guardar</Button>
      </div>
    </form>
  );
}
