"use client";

import { useEffect, useState } from "react";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";
import { Icon } from "@/src/components/ui/Icon";
import Modal from "@/src/components/ui/modal/Modal";

/** Lápiz + modal pequeño para renombrar leads / chats. */
export default function RenombrarInline({
  nombreActual,
  onGuardar,
  disabled = false,
  titulo = "Renombrar",
  ariaLabel = "Renombrar",
}: {
  nombreActual: string;
  onGuardar: (nombre: string) => Promise<void>;
  disabled?: boolean;
  titulo?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(nombreActual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValor(nombreActual);
    setError(null);
  }, [open, nombreActual]);

  async function guardar() {
    const nombre = valor.trim();
    if (nombre.length < 1) {
      setError("El nombre no puede estar vacío");
      return;
    }
    if (nombre.length > 200) {
      setError("Máximo 200 caracteres");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onGuardar(nombre);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el nombre");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-gray-200"
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <Icon name="mdi:pencil-outline" size={16} />
      </button>

      <Modal
        open={open}
        onClose={() => {
          if (!loading) setOpen(false);
        }}
        className="max-w-sm"
        showCloseButton={!loading}
        header={
          <div className="px-5 pb-1 pt-5">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              {titulo}
            </h3>
          </div>
        }
        footer={
          <div className="flex justify-end gap-2 px-5 py-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              loading={loading}
              onClick={() => void guardar()}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <div className="space-y-2 px-5 pb-2">
          <Input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Nombre"
            disabled={loading}
            autoComplete="off"
            error={Boolean(error)}
          />
          {error ? (
            <p className="text-theme-xs text-error-500">{error}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
