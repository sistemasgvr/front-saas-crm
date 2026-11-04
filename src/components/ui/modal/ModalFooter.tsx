import type { ReactNode } from "react";

/**
 * Contenido estándar de la prop `footer` de Modal: botones de acción a la
 * derecha y, encima, el error del envío — así sigue visible aunque el usuario
 * esté arriba de un formulario largo.
 *
 * Si el submit vive aquí, queda fuera del <form>: enlázalo con `form="<id>"`.
 */
export default function ModalFooter({
  children,
  error,
}: {
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="px-5 py-4">
      {error && (
        <p role="alert" className="mb-3 text-sm text-error-600">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">{children}</div>
    </div>
  );
}
