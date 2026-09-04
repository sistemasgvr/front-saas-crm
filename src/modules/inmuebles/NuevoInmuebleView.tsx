"use client";

import PageHeader from "@/src/components/ui/PageHeader";
import InmuebleForm from "./InmuebleForm";

export default function NuevoInmuebleView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo inmueble"
        description="Agrega una propiedad al catálogo de la organización."
        backHref="/inmuebles"
        backLabel="Volver a inmuebles"
      />
      <InmuebleForm mode="create" />
    </div>
  );
}
