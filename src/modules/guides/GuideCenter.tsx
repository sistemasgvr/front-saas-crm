"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/src/components/ui/Icon";
import PageHeader from "@/src/components/ui/PageHeader";
import { guideMatches, guideRecordLabel, guideSteps } from "./catalog";
import { useGuides } from "./GuideProvider";

export default function GuideCenter() {
  const context = useGuides();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  if (!context) return null;
  const { guides, access, storage, start, busy } = context;
  const filtered = guides.filter((g) =>
    `${g.title} ${g.description} ${g.category}`
      .toLocaleLowerCase("es")
      .includes(search.toLocaleLowerCase("es")),
  );
  const completed = guides.filter((g) => storage.tours[g.id]?.completed).length;
  return (
    <div data-tour="guide-center" className="space-y-6">
      <PageHeader
        title="Guía del sistema"
        description="Aprende una tarea a la vez. Retoma tus recorridos o repítelos cuando lo necesites."
      />
      <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-7 dark:border-brand-500/20 dark:bg-brand-500/10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
              A tu ritmo
            </p>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tu próxima tarea, con una guía al lado
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Los recorridos explican cada opción sin ejecutar acciones. Puedes
              cerrarlos con la X o Escape y continuar después. Solo verás los
              temas disponibles para tu rol y los módulos de tu empresa.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void start("bienvenida")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <Icon name="mdi:play-circle-outline" size={19} /> Empezar por lo
              esencial
            </button>
          </div>
          <div
            className="rounded-xl bg-white/80 px-6 py-4 dark:bg-gray-900/60"
            aria-label="Progreso de recorridos"
          >
            <p className="text-3xl font-semibold text-brand-600 dark:text-brand-400">
              {completed}
              <span className="text-lg font-normal text-gray-400">
                {" "}
                / {guides.length}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              recorridos completados
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Buscar un recorrido</span>
          <Icon
            name="mdi:magnify"
            size={20}
            className="absolute left-3 top-3 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar: leads, transferir, agenda…"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-800 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Progreso personal guardado en este navegador.
        </p>
      </div>
      {Array.from(new Set(filtered.map((g) => g.category))).map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {category}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered
              .filter((g) => g.category === category)
              .map((g) => {
                const progress = storage.tours[g.id];
                const total = guideSteps(g, access).length;
                const needsRecord = !!g.match && !guideMatches(g, pathname);
                return (
                  <article
                    key={g.id}
                    className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-brand-500 dark:bg-gray-800">
                        <Icon name={g.icon} size={22} />
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${progress?.completed ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}
                      >
                        {progress?.completed
                          ? "Completado"
                          : progress
                            ? "En progreso"
                            : `${total} pasos`}
                      </span>
                    </div>
                    <h3 className="mt-4 font-semibold text-gray-800 dark:text-gray-100">
                      {g.title}
                    </h3>
                    <p className="mb-5 mt-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      {g.description}
                    </p>
                    {needsRecord ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Elige el registro que quieres conocer. El recorrido
                          comenzará automáticamente cuando abras su detalle.
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void start(g.id, !!progress && !progress.completed)
                          }
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400"
                        >
                          Elegir {guideRecordLabel(g)} y empezar
                          <Icon name="mdi:arrow-right" size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void start(g.id, !!progress && !progress.completed)
                          }
                          className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/10 dark:text-brand-400"
                        >
                          {progress?.completed
                            ? "Repetir recorrido"
                            : progress
                              ? `Retomar · ${Math.min(progress.step + 1, total)}/${total}`
                              : "Iniciar recorrido"}
                        </button>
                        {progress && !progress.completed && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void start(g.id)}
                            className="text-xs text-gray-500 underline underline-offset-2 dark:text-gray-400"
                          >
                            Desde el inicio
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      ))}
      {filtered.length === 0 && (
        <p className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          No encontramos recorridos con esa búsqueda. Prueba el nombre de un
          módulo o una tarea.
        </p>
      )}
    </div>
  );
}
