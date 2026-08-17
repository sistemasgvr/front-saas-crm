import { getMe } from '@/src/lib/auth';

export default async function DashboardPage() {
  const me = await getMe();

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Dashboard</h1>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-gray-700 dark:text-gray-300">
          Bienvenido, <span className="font-medium">{me?.usuario.nombre}</span>
          {me?.organizacion ? <> — {me.organizacion.nombre}</> : null}.
        </p>
        <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
          Los KPIs y gráficos llegan en la Fase 11 del plan.
        </p>
      </div>
    </div>
  );
}
