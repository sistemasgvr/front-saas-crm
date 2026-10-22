import HelpTooltip from "./HelpTooltip";

export default function AsignadoInactivoAviso({
  asignado,
}: {
  asignado?: { nombre: string; activo?: boolean } | null;
}) {
  if (asignado?.activo !== false) return null;
  const aviso = `${asignado.nombre} está desactivado. Este lead conserva su asignación anterior: debe asumirlo un agente autorizado o transferirse a un asesor activo.`;
  return (
    <HelpTooltip
      content={aviso}
      label={aviso}
      iconName="mdi:account-alert-outline"
      iconClassName="text-warning-500 dark:text-warning-400"
      className="shrink-0"
      placement="bottom"
      triggerAsSpan
    />
  );
}
