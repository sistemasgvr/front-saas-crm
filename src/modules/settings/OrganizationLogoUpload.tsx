"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import FileInput from "@/src/components/form/input/FileInput";
import Label from "@/src/components/form/Label";
import Button from "@/src/components/ui/button/Button";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import { Icon } from "@/src/components/ui/Icon";
import { CRM_LOGO_SRC } from "@/src/components/ui/AppLogo";
import { queryKeys } from "@/src/lib/query/keys";
import type { OrganizacionActual } from "./types";

export default function OrganizationLogoUpload({
  org,
}: {
  org: OrganizacionActual;
}) {
  const router = useRouter();
  const cache = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputVersion, setInputVersion] = useState(0);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // El callback no accede al archivo fuera de esta selección.
    const frame = requestAnimationFrame(() => setPreview(url));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [file]);
  const mutation = useMutation({
    mutationFn: async (selected: File | null) => {
      const body = new FormData();
      if (selected) body.set("archivo", selected);
      const response = await fetch("/api/organizations/logo", {
        method: selected ? "POST" : "DELETE",
        ...(selected ? { body } : {}),
        signal: AbortSignal.timeout(30000),
      }).catch(() => {
        throw new Error(
          "No se pudo conectar con el servidor. Intenta de nuevo.",
        );
      });
      const result = (await response.json().catch(() => null)) as
        (OrganizacionActual & { message?: string }) | null;
      if (!response.ok || !result)
        throw new Error(
          result?.message ?? "No se pudo guardar el logo. Intenta de nuevo.",
        );
      return result;
    },
    onSuccess: async (updated) => {
      await cache.cancelQueries({ queryKey: queryKeys.organizationCurrent });
      setFile(null);
      setPreview(null);
      setError(null);
      setInputVersion((v) => v + 1);
      cache.setQueryData(queryKeys.organizationCurrent, updated);
      void cache.invalidateQueries({ queryKey: queryKeys.me });
      router.refresh();
      toast.success(
        updated.logoUrl
          ? "Logo de la empresa actualizado"
          : "Se restauró el logo del sistema",
      );
    },
    onError: (e) => setError(e.message),
    meta: { silent: true },
  });
  return (
    <div
      data-tour="organization-logo"
      className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
    >
      <div className="mb-1.5 flex items-center gap-1">
        <Label htmlFor="organization-logo" className="mb-0">
          Logo de la empresa
        </Label>
        <HelpTooltip
          content="El cambio del logo se guarda con el botón Subir logo o Cambiar logo, independientemente de los demás datos de la empresa."
          label="Cómo guardar el logo de la empresa"
          placement="bottom"
        />
      </div>
      <p className="mb-4 text-theme-xs text-gray-500 dark:text-gray-400">
        Personaliza el logo del menú lateral y la cabecera móvil. Si no subes
        uno, se mostrará el logo del sistema.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-24 w-44 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700">
          <Image
            key={preview ?? org.logoUrl ?? "default"}
            src={preview ?? org.logoUrl ?? CRM_LOGO_SRC}
            alt={
              file
                ? "Vista previa del logo seleccionado"
                : `Logo de ${org.nombre}`
            }
            width={160}
            height={72}
            unoptimized
            className="max-h-20 w-auto max-w-full object-contain"
            onError={(e) => {
              e.currentTarget.src = CRM_LOGO_SRC;
            }}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <FileInput
            key={inputVersion}
            id="organization-logo"
            describedBy={`organization-logo-help${error ? " organization-logo-error" : ""}`}
            invalid={!!error}
            accept="image/png,image/jpeg,image/webp"
            disabled={mutation.isPending}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (!selected) return;
              if (
                !["image/png", "image/jpeg", "image/webp"].includes(
                  selected.type,
                )
              ) {
                setError("Usa una imagen PNG, JPG o WebP");
                setFile(null);
                setPreview(null);
                event.target.value = "";
                return;
              }
              if (!selected.size || selected.size > 2 * 1024 * 1024) {
                setError("Elige una imagen de hasta 2 MB");
                setFile(null);
                setPreview(null);
                event.target.value = "";
                return;
              }
              setPreview(null);
              setFile(selected);
              setError(null);
            }}
          />
          <p
            id="organization-logo-help"
            className="text-theme-xs text-gray-500 dark:text-gray-400"
          >
            PNG, JPG o WebP · Máximo 2 MB. Se conserva la proporción y la
            transparencia. Recomendado: fondo transparente y buena legibilidad.
          </p>
          {error && (
            <p
              role="alert"
              id="organization-logo-error"
              className="text-theme-xs text-error-600 dark:text-error-400"
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              loading={mutation.isPending && !!mutation.variables}
              disabled={!file || mutation.isPending}
              onClick={() => mutation.mutate(file)}
              startIcon={<Icon name="mdi:cloud-upload-outline" size={17} />}
            >
              {org.logoUrl ? "Cambiar logo" : "Subir logo"}
            </Button>
            {file && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setError(null);
                  setInputVersion((v) => v + 1);
                }}
              >
                Cancelar selección
              </Button>
            )}
            {org.logoUrl && !file && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={mutation.isPending && mutation.variables === null}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(null)}
                startIcon={<Icon name="mdi:backup-restore" size={17} />}
              >
                Usar logo del sistema
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
