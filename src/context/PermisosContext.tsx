"use client";

import { createContext, useContext } from "react";
import { tienePermiso, type CodigoPermiso } from "@/src/lib/permisos";

const PermisosContext = createContext<readonly string[]>([]);

/** Permisos efectivos del usuario (de /me), para los componentes cliente. */
export function PermisosProvider({
  permisos,
  children,
}: {
  permisos: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <PermisosContext.Provider value={permisos}>
      {children}
    </PermisosContext.Provider>
  );
}

/** `const puede = usePermisos(); puede("leads.asignar")` */
export function usePermisos() {
  const permisos = useContext(PermisosContext);
  return (codigo: CodigoPermiso) => tienePermiso(permisos, codigo);
}
