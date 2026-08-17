export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Configuración</h1>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          Datos de la organización y conexión Meta — pantalla pendiente (el backend de{' '}
          <code>/organizations/current</code> ya existe desde la Fase 3).
        </p>
      </div>
    </div>
  );
}
