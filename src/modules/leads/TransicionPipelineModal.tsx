"use client";

import { useEffect, useId, useState } from "react";
import Button from "@/src/components/ui/button/Button";
import Modal from "@/src/components/ui/modal/Modal";
import Select from "@/src/components/form/Select";
import TextArea from "@/src/components/form/input/TextArea";
import Input from "@/src/components/form/input/InputField";
import {
  construirPayloadTransicion,
  formularioTransicionValido,
} from "./pipeline-transicion";
import type { CampoTransicionMeta } from "./types";

export default function TransicionPipelineModal({
  open = true,
  titulo,
  descripcion,
  campos,
  loading,
  onConfirmar,
  onCancelar,
}: {
  open?: boolean;
  titulo: string;
  descripcion?: string;
  campos: CampoTransicionMeta[];
  loading?: boolean;
  onConfirmar: (payload: {
    notaTransicion?: string;
    metadata?: Record<string, string>;
  }) => void;
  onCancelar: () => void;
}) {
  const baseId = useId();
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    setValores({});
  }, [titulo, campos]);

  const setValor = (codigo: string, valor: string) => {
    setValores((prev) => ({ ...prev, [codigo]: valor }));
  };

  const puedeConfirmar = formularioTransicionValido(campos, valores);

  const handleConfirmar = () => {
    if (!puedeConfirmar) return;
    onConfirmar(construirPayloadTransicion(campos, valores));
  };

  return (
    <Modal open={open} onClose={onCancelar}>
      <div className="p-5 pt-6 sm:p-6">
        <p className="pr-10 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{titulo}</p>
        {descripcion ? (
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{descripcion}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {campos.map((campo, index) => {
            const inputId = `${baseId}-${campo.codigo}-${index}`;
            if (campo.tipo === "textarea" || campo.codigo === "notaTransicion") {
              return (
                <div key={campo.codigo}>
                  <label htmlFor={inputId} className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                    {campo.etiqueta}
                    {campo.requerido ? <span className="text-error-500"> *</span> : null}
                  </label>
                  <TextArea
                    id={inputId}
                    rows={3}
                    placeholder={campo.placeholder}
                    value={valores[campo.codigo] ?? ""}
                    onChange={(e) => setValor(campo.codigo, e.target.value)}
                  />
                </div>
              );
            }
            if (campo.tipo === "select") {
              return (
                <div key={campo.codigo}>
                  <label className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                    {campo.etiqueta}
                    {campo.requerido ? <span className="text-error-500"> *</span> : null}
                  </label>
                  <Select
                    options={(campo.opciones ?? []).map((o) => ({
                      value: o.codigo,
                      label: o.etiqueta,
                    }))}
                    placeholder={`Elige ${campo.etiqueta.toLowerCase()}`}
                    value={valores[campo.codigo] ?? ""}
                    onChange={(v) => setValor(campo.codigo, v)}
                  />
                </div>
              );
            }
            if (campo.tipo === "datetime") {
              return (
                <div key={campo.codigo}>
                  <label htmlFor={inputId} className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                    {campo.etiqueta}
                    {campo.requerido ? <span className="text-error-500"> *</span> : null}
                  </label>
                  <Input
                    id={inputId}
                    type="datetime-local"
                    value={valores[campo.codigo] ?? ""}
                    onChange={(e) => setValor(campo.codigo, e.target.value)}
                    required={campo.requerido}
                  />
                </div>
              );
            }
            return (
              <div key={campo.codigo}>
                <label htmlFor={inputId} className="mb-1.5 block text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                  {campo.etiqueta}
                  {campo.requerido ? <span className="text-error-500"> *</span> : null}
                </label>
                <Input
                  id={inputId}
                  type="text"
                  placeholder={campo.placeholder}
                  value={valores[campo.codigo] ?? ""}
                  onChange={(e) => setValor(campo.codigo, e.target.value)}
                  required={campo.requerido}
                />
              </div>
            );
          })}
        </div>

        {!puedeConfirmar && (
          <p className="mt-3 text-theme-xs text-gray-400">Completa los campos obligatorios (*) para continuar.</p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end dark:border-gray-800">
          <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            className="w-full sm:w-auto"
            loading={loading}
            disabled={!puedeConfirmar}
            onClick={handleConfirmar}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
