"use client";
import { useState } from "react";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import Button from "@/src/components/ui/button/Button";

export default function ConfiguracionCoexistenciaForm({ appId, configId, disabled, onSave }: {
  appId: string; configId: string | null; disabled: boolean;
  onSave: (appId: string, configId: string | null) => Promise<void>;
}) {
  const [value, setValue] = useState(configId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="mt-4 space-y-2" onSubmit={async event => {
    event.preventDefault();
    const id = value.trim();
    if (id && !/^\d{1,64}$/.test(id)) { setMessage("Ingresa un Configuration ID numérico de hasta 64 dígitos."); return; }
    setSaving(true); setMessage("");
    try { await onSave(appId, id || null); setMessage("Configuration ID guardado para esta empresa."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la configuración."); }
    finally { setSaving(false); }
  }}>
    <Label htmlFor="whatsappSignupConfigId">Configuration ID de Embedded Signup v4</Label>
    <p className="text-sm text-gray-500">Configuración de la aplicación Meta {appId}. Se obtiene en Inicio de sesión con Facebook para empresas → Configuraciones. Se guarda para esta empresa.</p>
    <div className="flex flex-wrap items-start gap-3">
      <div className="w-full sm:max-w-sm"><Input id="whatsappSignupConfigId" type="text" maxLength={64} value={value}
        onChange={event => setValue(event.target.value)} disabled={disabled || saving} placeholder="Configuration ID" /></div>
      <Button type="submit" size="sm" disabled={disabled} loading={saving}>Guardar configuración</Button>
    </div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
