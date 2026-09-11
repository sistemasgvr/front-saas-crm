"use client";

import { useEffect, useState } from "react";
import Button from "@/src/components/ui/button/Button";
import Input from "@/src/components/form/input/InputField";
import Label from "@/src/components/form/Label";
import Modal from "@/src/components/ui/modal/Modal";
import { Icon } from "@/src/components/ui/Icon";
import { ETIQUETA_TIPO_LEAD } from "@/src/modules/leads/pipeline";
import { TIPOS_LEAD_INMOBILIARIA, type TipoLeadInmobiliaria } from "@/src/modules/leads/types";

const ICONO_TIPO: Record<string, string> = {
  COMPRA: "mdi:home-search-outline",
  VENTA: "mdi:home-export-outline",
  OTRO: "mdi:dots-horizontal-circle-outline",
};

export interface CrearLeadDesdeChatValues {
  nombre: string;
  telefono: string;
  email: string;
  tipoLead: TipoLeadInmobiliaria | "";
}

export default function CrearLeadDesdeChatModal({
  open,
  onClose,
  loading,
  defaults,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  defaults: { nombre: string; telefono: string };
  onSubmit: (values: CrearLeadDesdeChatValues) => void;
}) {
  const [nombre, setNombre] = useState(defaults.nombre);
  const [telefono, setTelefono] = useState(defaults.telefono);
  const [email, setEmail] = useState("");
  const [tipoLead, setTipoLead] = useState<TipoLeadInmobiliaria | "">("");

  useEffect(() => {
    if (!open) return;
    setNombre(defaults.nombre);
    setTelefono(defaults.telefono);
    setEmail("");
    setTipoLead("");
  }, [open, defaults.nombre, defaults.telefono]);

  const puedeGuardar = nombre.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={
        <div className="flex items-start gap-3 px-5 py-4 pr-12">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <Icon name="mdi:account-plus-outline" size={22} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Crear lead</h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              Se vincula a este chat de WhatsApp y queda asignado a ti.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            loading={loading}
            disabled={!puedeGuardar}
            onClick={() =>
              onSubmit({
                nombre: nombre.trim(),
                telefono: telefono.trim(),
                email: email.trim(),
                tipoLead,
              })
            }
          >
            Crear lead
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-5 py-4">
        <div>
          <Label htmlFor="lead-wa-nombre">Nombre</Label>
          <Input
            id="lead-wa-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del contacto"
          />
        </div>
        <div>
          <Label htmlFor="lead-wa-telefono">Teléfono (opcional)</Label>
          <Input
            id="lead-wa-telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+51999999999"
          />
        </div>
        <div>
          <Label htmlFor="lead-wa-email">Email (opcional)</Label>
          <Input
            id="lead-wa-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
          />
        </div>
        <div>
          <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo (opcional)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS_LEAD_INMOBILIARIA.map((tipo) => {
              const activo = tipoLead === tipo;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoLead((prev) => (prev === tipo ? "" : tipo))}
                  className={`inline-flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-theme-xs font-medium transition ${
                    activo
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
                  }`}
                >
                  <Icon name={ICONO_TIPO[tipo] ?? "mdi:circle-outline"} size={18} />
                  {ETIQUETA_TIPO_LEAD[tipo] ?? tipo}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
