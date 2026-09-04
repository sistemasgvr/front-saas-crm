"use client";

import Link from "next/link";
import Button from "@/src/components/ui/button/Button";
import CollapsibleSection from "@/src/components/ui/CollapsibleSection";
import { Icon } from "@/src/components/ui/Icon";
import { canManageOrganization } from "@/src/lib/roles";

/** Acceso al catálogo de inmuebles desde Configuración (sin CRUD duplicado). */
export default function InmueblesSettingsEntryCard({
  rol,
}: {
  rol: string | null | undefined;
}) {
  const puedeCrear = canManageOrganization(rol);

  return (
    <CollapsibleSection
      title="Catálogo de inmuebles"
      icon="mdi:home-city-outline"
      help="Propiedades del catálogo usadas en visitas, interés del lead y el embudo comercial."
      preview="Gestiona el inventario inmobiliario del CRM."
      defaultOpen={false}
    >
      <div className="flex flex-col gap-3">
        <p className="text-theme-sm text-gray-600 dark:text-gray-400">
          Consulta y organiza las propiedades disponibles para visitas y el pipeline.
          El alta y edición completa están en el catálogo.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/inmuebles" className="shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              startIcon={<Icon name="mdi:home-search-outline" size={18} />}
            >
              Ver catálogo
            </Button>
          </Link>
          {puedeCrear ? (
            <Link href="/inmuebles/nuevo" className="shrink-0">
              <Button
                type="button"
                size="sm"
                startIcon={<Icon name="mdi:plus" size={18} />}
              >
                Nuevo inmueble
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </CollapsibleSection>
  );
}
