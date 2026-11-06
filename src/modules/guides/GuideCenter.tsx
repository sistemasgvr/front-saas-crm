"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import MetricCard from "@/src/components/common/MetricCard";
import Input from "@/src/components/form/input/InputField";
import Badge from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import HelpTooltip from "@/src/components/ui/HelpTooltip";
import { Icon } from "@/src/components/ui/Icon";
import ItemCard from "@/src/components/ui/ItemCard";
import PageHeader from "@/src/components/ui/PageHeader";
import { guideMatches, guideRecordLabel, guideSteps } from "./catalog";
import { useGuides } from "./GuideProvider";

const AYUDA_GUIAS =
  "Los recorridos explican cada opción sin ejecutar acciones. Puedes cerrarlos con la X o Escape y continuar después. Solo verás los temas disponibles para tu rol y los módulos de tu empresa. Tu progreso se guarda en este navegador.";
const AYUDA_REGISTRO =
  "Elige el registro que quieres conocer. El recorrido comenzará automáticamente cuando abras su detalle.";

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
        description="Aprende una tarea a la vez y retoma tus recorridos cuando quieras."
        help={AYUDA_GUIAS}
      >
        <Button
          size="sm"
          disabled={busy}
          startIcon={<Icon name="mdi:play-circle-outline" size={18} />}
          onClick={() => void start("bienvenida")}
        >
          Empezar por lo esencial
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <label htmlFor="buscar-recorrido" className="sr-only">
            Buscar un recorrido
          </label>
          <Icon
            name="mdi:magnify"
            size={20}
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-400"
          />
          <Input
            id="buscar-recorrido"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar: leads, transferir, agenda…"
            className="pl-11"
          />
        </div>
        <div className="sm:w-60">
          <MetricCard
            label="Recorridos completados"
            value={`${completed} / ${guides.length}`}
            icon="mdi:flag-checkered"
          />
        </div>
      </div>

      {Array.from(new Set(filtered.map((g) => g.category))).map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered
              .filter((g) => g.category === category)
              .map((g) => {
                const progress = storage.tours[g.id];
                const total = guideSteps(g, access).length;
                const needsRecord = !!g.match && !guideMatches(g, pathname);
                return (
                  <ItemCard
                    key={g.id}
                    title={g.title}
                    icon={g.icon}
                    aside={
                      progress?.completed ? (
                        <Badge size="sm" color="success">Completado</Badge>
                      ) : progress ? (
                        <Badge size="sm" color="warning">En progreso</Badge>
                      ) : (
                        <Badge size="sm" color="light">{total} pasos</Badge>
                      )
                    }
                    description={g.description}
                    footer={
                      needsRecord ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            endIcon={<Icon name="mdi:arrow-right" size={16} />}
                            onClick={() => void start(g.id, !!progress && !progress.completed)}
                          >
                            Elegir {guideRecordLabel(g)}
                          </Button>
                          <HelpTooltip content={AYUDA_REGISTRO} />
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant={progress?.completed ? "outline" : "primary"}
                            disabled={busy}
                            startIcon={
                              <Icon
                                name={progress?.completed ? "mdi:replay" : "mdi:play-outline"}
                                size={16}
                              />
                            }
                            onClick={() => void start(g.id, !!progress && !progress.completed)}
                          >
                            {progress?.completed
                              ? "Repetir"
                              : progress
                                ? `Retomar · ${Math.min(progress.step + 1, total)}/${total}`
                                : "Iniciar"}
                          </Button>
                          {progress && !progress.completed && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void start(g.id)}
                              className="text-theme-xs font-medium text-gray-500 hover:text-brand-500 disabled:opacity-50 dark:text-gray-400"
                            >
                              Desde el inicio
                            </button>
                          )}
                        </>
                      )
                    }
                  />
                );
              })}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <EmptyState
            icon="mdi:map-search-outline"
            title="No encontramos recorridos con esa búsqueda"
            description="Prueba el nombre de un módulo o una tarea."
          />
        </div>
      )}
    </div>
  );
}
