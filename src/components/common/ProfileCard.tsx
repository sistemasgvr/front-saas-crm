import { Fragment, type ReactNode } from "react";
import Avatar from "@/src/components/ui/avatar/Avatar";

interface ProfileCardProps {
  name: string;
  /** Datos cortos bajo el nombre, separados por una línea vertical. */
  meta?: ReactNode[];
  src?: string | null;
  /** Icono Iconify cuando no hay imagen. */
  icon?: string;
  shape?: "circle" | "rounded";
  /** Badges / switches junto al nombre (lado derecho en escritorio). */
  badges?: ReactNode;
  /** Botones de acción (columna derecha). */
  actions?: ReactNode;
}

/**
 * Cabecera de perfil — copia de user-profile/UserMetaCard del template
 * TailAdmin, con avatar, nombre, metadatos y acciones por props.
 */
export default function ProfileCard({
  name,
  meta = [],
  src,
  icon,
  shape = "circle",
  badges,
  actions,
}: ProfileCardProps) {
  const items = meta.filter((item) => item !== null && item !== undefined && item !== false && item !== "");

  return (
    <div className="p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <Avatar
            name={name}
            src={src}
            icon={icon}
            shape={shape}
            size="2xl"
            className="border border-gray-200 dark:border-gray-800"
          />
          <div className="order-3 min-w-0 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {name}
            </h4>
            {items.length > 0 && (
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                {items.map((item, index) => (
                  <Fragment key={index}>
                    {index > 0 && <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>}
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item}</p>
                  </Fragment>
                ))}
              </div>
            )}
          </div>
          {badges && (
            <div className="flex flex-wrap items-center justify-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {badges}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0 xl:justify-end">{actions}</div>
        )}
      </div>
    </div>
  );
}
