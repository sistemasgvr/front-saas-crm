"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { Driver, DriveStep } from "driver.js";
import { toast } from "sonner";
import { Icon } from "@/src/components/ui/Icon";
import type { MeResponse } from "@/src/lib/auth";
import {
  availableGuides,
  guideMatches,
  guideRecordLabel,
  guideSelectionState,
  guideSteps,
  type Guide,
  type GuideAccess,
} from "./catalog";
import {
  guideStorageKey,
  parseGuideStorage,
  type GuideStorage,
} from "./progress";

const CHANGE = "crm-guides-change";
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE, notify);
  };
};
const visible = (selector?: string): Element | undefined =>
  selector
    ? Array.from(document.querySelectorAll(selector)).find(
        (e) =>
          e.getClientRects().length > 0 &&
          getComputedStyle(e).visibility !== "hidden",
      )
    : undefined;

async function waitForPage(
  selector: string,
  path: string,
  signal: AbortSignal,
) {
  const until = Date.now() + 12000;
  while (!signal.aborted && Date.now() < until) {
    if (window.location.pathname === path && visible(selector)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (signal.aborted)
    throw new DOMException("Recorrido cancelado", "AbortError");
  throw new Error(
    "La pantalla aún no está disponible. Cuando termine de cargar, vuelve a iniciar el recorrido desde Ayuda.",
  );
}

type GuideContextValue = {
  access: GuideAccess;
  guides: Guide[];
  storage: GuideStorage;
  busy: boolean;
  start: (id: string, resume?: boolean) => Promise<void>;
};
const GuideContext = createContext<GuideContextValue | null>(null);
export const useGuides = () => useContext(GuideContext);

export default function GuideProvider({
  me,
  children,
}: {
  me: MeResponse;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const key = guideStorageKey(
    me.usuario.id,
    me.organizacion?.id ?? "sin-organizacion",
  );
  const read = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const storage = useMemo(() => parseGuideStorage(raw), [raw]);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const allowed = useMemo(() => availableGuides(me), [me]);
  const [busy, setBusy] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [selection, setSelection] = useState<{
    id: string;
    resume: boolean;
    scope: string;
  } | null>(null);
  const driverRef = useRef<Driver | null>(null);
  const pending = useRef<AbortController | null>(null);
  const activePath = useRef<string | null>(null);
  const write = useCallback(
    (update: (previous: GuideStorage) => GuideStorage) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify(update(parseGuideStorage(read()))),
        );
        window.dispatchEvent(new Event(CHANGE));
      } catch {
        /* La guía funciona incluso cuando el navegador no permite guardar preferencias. */
      }
    },
    [key, read],
  );
  const dismissWelcome = useCallback(() => {
    setWelcomeDismissed(true);
    write((s) => ({ ...s, welcomeSeen: true }));
  }, [write]);

  useEffect(() => {
    if (activePath.current && activePath.current !== pathname)
      driverRef.current?.destroy();
  }, [pathname]);
  useEffect(
    () => () => {
      pending.current?.abort();
      driverRef.current?.destroy();
    },
    [key],
  );

  const start = useCallback(
    async (id: string, resume = false) => {
      const guide = allowed.find((g) => g.id === id);
      if (!guide) return;
      if (guide.match && !guideMatches(guide, pathname)) {
        pending.current?.abort();
        driverRef.current?.destroy();
        setBusy(false);
        dismissWelcome();
        setSelection({ id, resume, scope: key });
        if (pathname !== guide.path) router.push(guide.path);
        return;
      }
      setSelection(null);
      pending.current?.abort();
      driverRef.current?.destroy();
      const controller = new AbortController();
      pending.current = controller;
      const path = guide.match ? pathname : guide.path;
      setBusy(true);
      dismissWelcome();
      try {
        // La librería solo se descarga al iniciar una guía.
        const { driver } = await import("driver.js");
        if (controller.signal.aborted) return;
        if (pathname !== path) router.push(path);
        await waitForPage(guide.ready, path, controller.signal);
        const steps = guideSteps(guide, me);
        const progress = parseGuideStorage(read()).tours[id];
        const initial =
          resume && progress && !progress.completed
            ? Math.min(progress.step, steps.length - 1)
            : 0;
        let completed = false;
        const expanded: HTMLElement[] = [];
        const save = (step: number) =>
          write((s) => ({
            ...s,
            tours: { ...s.tours, [id]: { step, completed } },
          }));
        const driveSteps: DriveStep[] = steps.map((s) => ({
          element: s.target ? () => visible(s.target)! : undefined,
          popover: { title: s.title, description: s.description },
          onHighlightStarted: () => {
            // Solo despliega secciones de lectura; nunca dispara una acción comercial.
            if (s.section) {
              const toggle = document.querySelector<HTMLElement>(
                `[data-tour-section="${s.section}"] button[aria-expanded="false"]`,
              );
              if (toggle) {
                toggle.click();
                expanded.push(toggle);
              }
            }
          },
        }));
        // Los pasos sin objetivo o con un control no disponible se explican en el centro.
        const instance = driver({
          steps: driveSteps,
          animate: !window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
          showProgress: true,
          progressText: "{{current}} de {{total}}",
          nextBtnText: "Siguiente",
          prevBtnText: "Anterior",
          doneBtnText: "Finalizar",
          allowClose: true,
          disableActiveInteraction: true,
          overlayOpacity: 0.55,
          stagePadding: 7,
          stageRadius: 12,
          popoverClass: "crm-guide-popover",
          onPopoverRender: (popover) => {
            popover.closeButton.setAttribute("aria-label", "Pausar recorrido");
            save(instance.getActiveIndex() ?? 0);
          },
          onNextClick: () => {
            if (instance.isLastStep()) {
              completed = true;
              save(steps.length - 1);
              instance.destroy();
              toast.success(
                "Recorrido completado. Puedes repetirlo desde la Guía del sistema.",
              );
            } else instance.moveNext();
          },
          onDoneClick: () => {
            completed = true;
            save(steps.length - 1);
            instance.destroy();
            toast.success(
              "Recorrido completado. Puedes repetirlo desde la Guía del sistema.",
            );
          },
          onDestroyed: () => {
            for (const button of expanded)
              if (
                button.isConnected &&
                button.getAttribute("aria-expanded") === "true"
              )
                button.click();
            if (driverRef.current === instance) {
              driverRef.current = null;
              activePath.current = null;
            }
          },
        });
        driverRef.current = instance;
        activePath.current = path;
        instance.drive(initial);
      } catch (error) {
        if (!controller.signal.aborted)
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo iniciar la guía",
          );
      } finally {
        if (pending.current === controller) setBusy(false);
      }
    },
    [allowed, pathname, dismissWelcome, key, router, me, read, write],
  );

  useEffect(() => {
    if (!selection || selection.scope !== key) return;
    const guide = allowed.find((g) => g.id === selection.id);
    if (!guide) return;
    let settled = false;
    let navigating = false;
    const check = () => {
      if (settled) return;
      const state = guideSelectionState(guide, pathname);
      if (state === "leave") {
        settled = true;
        setSelection(null);
        return;
      }
      // La lista de leads abre primero una ficha rápida. Durante una selección
      // guiada continuamos a la ficha completa del registro elegido.
      if (state === "choose" && !navigating) {
        const recordPath = visible("[data-tour-record-path]")?.getAttribute(
          "data-tour-record-path",
        );
        if (recordPath && guideMatches(guide, recordPath)) {
          navigating = true;
          router.push(recordPath);
        }
      }
      if (state === "ready" && visible(guide.ready)) {
        settled = true;
        observer.disconnect();
        void start(selection.id, selection.resume);
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-tour-record-path", "class"],
    });
    const frame = requestAnimationFrame(check);
    return () => {
      settled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [selection, key, allowed, pathname, router, start]);

  const selectedGuide =
    selection?.scope === key
      ? allowed.find((g) => g.id === selection.id)
      : undefined;

  return (
    <GuideContext.Provider
      value={{ access: me, guides: allowed, storage, busy, start }}
    >
      {hydrated &&
        !welcomeDismissed &&
        !storage.welcomeSeen &&
        pathname !== "/ayuda" && (
          <aside
            className="fixed bottom-4 left-4 right-4 z-[100000] max-w-sm rounded-2xl border border-brand-100 bg-white p-4 shadow-lg sm:left-auto sm:right-6 dark:border-gray-700 dark:bg-gray-900"
            aria-label="Bienvenida al CRM"
          >
            <div className="flex items-start gap-3">
              <Icon
                name="mdi:compass-outline"
                size={24}
                className="shrink-0 text-brand-500"
              />
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  Conoce tu CRM, paso a paso
                </p>
                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                  Elige una tarea y aprende a usarla a tu ritmo. Puedes repetir
                  las guías cuando quieras.
                </p>
                <div className="mt-3 flex gap-4 text-theme-sm">
                  <Link
                    href="/ayuda"
                    onClick={dismissWelcome}
                    className="font-medium text-brand-600 dark:text-brand-400"
                  >
                    Ver recorridos
                  </Link>
                  <button
                    type="button"
                    onClick={dismissWelcome}
                    className="text-gray-500 dark:text-gray-400"
                  >
                    Más adelante
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      {busy && (
        <div
          className="fixed bottom-4 right-4 z-[100001] rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg"
          role="status"
        >
          Preparando recorrido…{" "}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => {
              pending.current?.abort();
              setBusy(false);
            }}
          >
            Cancelar
          </button>
        </div>
      )}
      {selectedGuide && !busy && (
        <aside
          className="fixed bottom-4 left-4 right-4 z-[100000] rounded-xl border border-brand-200 bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-md dark:border-gray-700 dark:bg-gray-900"
          aria-label="Elegir registro para el recorrido"
          role="status"
        >
          <p className="font-semibold text-gray-800 dark:text-white">
            {selectedGuide.title}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Selecciona el {guideRecordLabel(selectedGuide)} que quieres
            recorrer.{" "}
            {selectedGuide.id === "inmueble-editar"
              ? "Abre su ficha y entra en Editar; la guía comenzará automáticamente."
              : "La guía comenzará automáticamente al abrir su detalle."}
          </p>
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-400"
          >
            Cancelar recorrido
          </button>
        </aside>
      )}
      {children}
    </GuideContext.Provider>
  );
}
