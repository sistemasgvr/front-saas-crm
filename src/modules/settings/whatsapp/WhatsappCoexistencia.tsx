"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { unwrapAction } from "@/src/lib/action-result";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import { coexistenciaCode, coexistenciaComplete, coexistenciaConfig, guardarCoexistenciaConfig } from "./coexistencia-actions";
import ConfiguracionCoexistenciaForm from "./ConfiguracionCoexistenciaForm";
import { captureFacebookLoginRedirect } from "./facebook-login-redirect";
import { parseSignupEvent, type SignupEvent } from "./signup-event";

type Facebook = { init: (config: object) => void; login: (callback: (response: { authResponse?: { code?: string } }) => void, options: object) => void };
type FacebookWindow = Window & { FB?: Facebook; fbAsyncInit?: () => void };
type Phase = "idle" | "authorizing" | "waiting" | "completing" | "done" | "error";
type Notice = { tone: "info" | "success" | "error"; text: string; detail?: string };

let sdk: Promise<Facebook> | undefined;
/** Una sola carga por pestaña: el popup debe abrirse en el mismo clic del usuario. */
function loadSdk(): Promise<Facebook> {
  const w = window as FacebookWindow;
  if (w.FB) return Promise.resolve(w.FB);
  sdk ??= new Promise<Facebook>((resolve, reject) => {
    const fail = (text: string) => { window.clearTimeout(timer); sdk = undefined; reject(new Error(text)); };
    const timer = window.setTimeout(() => fail("No se pudo cargar Facebook. Revisa el bloqueador de anuncios o rastreadores del navegador."), 15000);
    w.fbAsyncInit = () => { window.clearTimeout(timer); resolve(w.FB!); };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/es_LA/sdk.js"; script.async = true; script.crossOrigin = "anonymous";
    script.onerror = () => { script.remove(); fail("No se pudo cargar Facebook. Revisa tu conexión o el bloqueador del navegador."); };
    document.body.appendChild(script);
  });
  return sdk;
}

const STEPS = [
  { title: "Autoriza en Meta", text: "Inicia sesión con Facebook y elige el portafolio de tu empresa." },
  { title: "Confirma en el celular", text: "Escanea el código QR desde WhatsApp Business y decide si compartes el historial." },
  { title: "Sincronizamos el CRM", text: "Validamos el número y pedimos contactos e historial autorizados." },
];
const STEP_BY_PHASE: Record<Phase, number> = { idle: -1, authorizing: 0, waiting: 1, completing: 2, done: 3, error: -1 };

function metaNotice(data: SignupEvent): Notice {
  if (data.errorMessage) return { tone: "error", text: "Meta no pudo completar la conexión.",
    detail: `${data.errorMessage}${data.errorCode ? ` (código ${data.errorCode})` : ""}${data.sessionId ? ` · Sesión ${data.sessionId}` : ""}` };
  return { tone: "error", text: "Cerraste el flujo de Meta antes de terminar.",
    detail: data.currentStep ? `Se detuvo en el paso ${data.currentStep}. Puedes volver a intentarlo cuando quieras.` : "Puedes volver a intentarlo cuando quieras." };
}

export default function WhatsappCoexistencia() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState<Notice>();
  const [sdkError, setSdkError] = useState("");
  const [readyApp, setReadyApp] = useState<string>();
  const cleanup = useRef<() => void>(() => {});
  const query = useQueryClient();
  const settings = useQuery({ queryKey: ["whatsappCoexistenciaConfig"], queryFn: async () => unwrapAction(await coexistenciaConfig()) });
  const config = settings.data;
  const busy = phase === "authorizing" || phase === "waiting" || phase === "completing";
  useEffect(() => () => cleanup.current(), []);

  // Precargar el SDK al abrir la pantalla: así basta un solo clic para abrir Meta.
  useEffect(() => {
    if (!config?.configId) return;
    let alive = true;
    loadSdk().then(fb => {
      if (!alive) return;
      fb.init({ appId: config.appId, version: config.version, autoLogAppEvents: false, xfbml: false });
      setSdkError(""); setReadyApp(config.appId);
    }, (error: Error) => { if (alive) setSdkError(error.message); });
    return () => { alive = false; };
  }, [config?.appId, config?.configId, config?.version]);

  const ready = !!config?.configId && readyApp === config.appId;

  function cancel() {
    cleanup.current();
    setPhase("idle");
    setNotice({ tone: "info", text: "Conexión cancelada en el CRM.", detail: "Si llegaste a confirmar en el celular, revisa el estado del número en Meta antes de reintentar." });
  }

  function launch() {
    if (!config?.configId || !ready || busy) return;
    const appId = config.appId, configId = config.configId;
    cleanup.current(); setPhase("authorizing");
    setNotice({ tone: "info", text: "Completa los pasos en la ventana de Meta.", detail: "Mantén a mano el celular con WhatsApp Business abierto y actualizado." });
    let active = true;
    let session: Promise<{ sessionId: string }> | undefined;
    let asset: { wabaId: string; phoneNumberId?: string } | undefined;
    let completing = false;
    let redirectUri: string | undefined;
    let restoreRedirectCapture = () => {};
    let missingEventTimer: number | undefined;
    const finish = (next: Phase, n: Notice) => { if (!active) return; setPhase(next); setNotice(n); cleanup.current(); };
    const fail = (text: string, detail?: string) => finish("error", { tone: "error", text, detail });
    const timer = window.setTimeout(() => fail("La conexión tardó demasiado.", "Revisa el resultado en Meta antes de volver a intentarlo."), 15 * 60_000);
    const complete = async () => {
      if (!active || !session || !asset || completing) return;
      completing = true;
      window.clearTimeout(missingEventTimer);
      setPhase("completing");
      setNotice({ tone: "info", text: "Validando el número y sincronizando con el CRM…", detail: "Esto puede tardar hasta un minuto. No cierres esta pestaña." });
      try {
        const s = await session;
        if (!active) return;
        unwrapAction(await coexistenciaComplete(s.sessionId, asset.wabaId, asset.phoneNumberId));
        await Promise.all([query.invalidateQueries({ queryKey: queryKeys.whatsappConexiones }), query.invalidateQueries({ queryKey: queryKeys.whatsappNumerosDisponibles })]);
        finish("done", { tone: "success", text: "¡Tu WhatsApp quedó conectado!",
          detail: "Pedimos la sincronización de contactos e historial autorizado; los mensajes se irán incorporando al CRM en los próximos minutos. Sigue usando la app del celular con normalidad." });
      } catch (error) { fail("No se pudo completar el alta.", error instanceof Error ? error.message : undefined); }
    };
    const listener = (event: MessageEvent) => {
      if (!active) return;
      const data = parseSignupEvent(event.origin, event.data);
      if (!data) return;
      if (data.event === "CANCEL" || data.event === "ERROR") { finish("error", metaNotice(data)); return; }
      if (data.event === "FINISH_ONLY_WABA") { fail("Meta terminó sin conectar un número.", "Revisa que la configuración de Meta incluya WhatsApp Cloud API y la conexión de una cuenta de WhatsApp Business existente."); return; }
      if (!["FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING", "FINISH"].includes(data.event)) return;
      if (!data.wabaId) { fail("Meta no devolvió el identificador de la cuenta.", "Revisa el alta en Meta y vuelve a intentarlo."); return; }
      asset = { wabaId: data.wabaId, phoneNumberId: data.phoneNumberId };
      void complete();
    };
    cleanup.current = () => { active = false; restoreRedirectCapture(); window.clearTimeout(missingEventTimer); window.clearTimeout(timer); window.removeEventListener("message", listener); };
    window.addEventListener("message", listener);
    try {
      restoreRedirectCapture = captureFacebookLoginRedirect(appId, configId, uri => { redirectUri = uri; });
      // Llamada síncrona dentro del clic: evita que el navegador bloquee el popup.
      (window as FacebookWindow).FB!.login(response => {
        if (!active || session) return;
        const code = response.authResponse?.code;
        if (!code) { fail("No se recibió la autorización de Meta.", "Si cerraste la ventana, vuelve a intentarlo. Si Meta mostró un aviso, revisa la sección de ayuda."); return; }
        // El code vence en 30 segundos: enviarlo inmediatamente, aun sin evento FINISH.
        // Sin URI capturada el backend sigue la guía oficial (sin redirect_uri).
        session = coexistenciaCode(code, redirectUri).then(unwrapAction);
        session.catch(error => fail("Meta rechazó la autorización.", error instanceof Error ? error.message : undefined));
        void session.then(() => {
          if (!active || asset) return;
          setPhase("waiting");
          setNotice({ tone: "info", text: "Autorizado. Esperando la confirmación desde tu celular…", detail: "Escanea el QR con WhatsApp Business y termina las pantallas de Meta." });
          missingEventTimer = window.setTimeout(() => {
            if (active && !asset) fail("Meta autorizó la aplicación, pero no envió la cuenta de WhatsApp.",
              "Vuelve a conectar y completa todas las pantallas de WhatsApp Business. Si solo aparece el acceso a Facebook, revisa que el Configuration ID sea de tipo WhatsApp Embedded Signup.");
          }, 60_000);
        }, () => {});
        void complete();
      }, { config_id: configId, response_type: "code", override_default_response_type: true,
        extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" } });
    } catch { fail("No se pudo abrir Meta.", "Permite las ventanas emergentes para este sitio e inténtalo de nuevo."); }
  }

  const current = STEP_BY_PHASE[phase];
  const status = !config ? null
    : phase === "done" ? { label: "Conectado", cls: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400" }
    : busy ? { label: "Conectando", cls: "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400" }
    : !config.configId ? { label: "Falta configuración", cls: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400" }
    : { label: "Listo para conectar", cls: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300" };
  const noticeCls = { info: "border-blue-light-200 bg-blue-light-50 text-blue-light-800 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-blue-light-300",
    success: "border-success-200 bg-success-50 text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300",
    error: "border-error-200 bg-error-50 text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300" };
  const noticeIcon = { info: "mdi:information-outline", success: "mdi:check-circle-outline", error: "mdi:alert-circle-outline" };

  return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <header className="flex flex-wrap items-start gap-4 border-b border-gray-100 p-5 dark:border-gray-800 sm:p-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#1DA851]"><Icon name="mdi:whatsapp" size={28} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Conectar mi WhatsApp Business del celular</h2>
          {status && <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>}
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Conserva tu número y sigue usando la app del celular junto con el CRM (coexistencia). Los mensajes de ambos lados se reflejan en el CRM.</p>
      </div>
    </header>

    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_minmax(0,320px)]">
      <div className="space-y-5">
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => {
            const done = current > i, active = current === i;
            return <li key={step.title} className={`rounded-xl border p-4 transition ${active ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-800"}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-success-500 text-white" : active ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"}`}>
                  {done ? <Icon name="mdi:check" size={14} /> : i + 1}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">{step.title}</span>
                {active && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-brand-500" aria-hidden />}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{step.text}</p>
            </li>;
          })}
        </ol>

        {notice && <div role={notice.tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-xl border p-4 text-sm ${noticeCls[notice.tone]}`}>
          <Icon name={noticeIcon[notice.tone]} size={20} className="mt-0.5 shrink-0" />
          <div><p className="font-medium">{notice.text}</p>{notice.detail && <p className="mt-1 opacity-90">{notice.detail}</p>}</div>
        </div>}
        {settings.isError && <p role="alert" className="text-sm text-error-600">{settings.error.message}</p>}
        {sdkError && <p role="alert" className="text-sm text-error-600">{sdkError}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={launch} disabled={!ready || busy} loading={busy || (!!config?.configId && !ready && !sdkError)}
            startIcon={<Icon name="mdi:facebook" size={18} />}>
            {busy ? "Conectando…" : phase === "done" ? "Conectar otro número" : phase === "error" ? "Reintentar conexión" : !config?.configId ? "Configura el ID para continuar" : ready ? "Conectar con Meta" : "Preparando Meta…"}
          </Button>
          {busy && <Button variant="outline" onClick={cancel}>Cancelar</Button>}
        </div>

        {config && <details className="group rounded-xl border border-gray-200 dark:border-gray-800" open={!config.configId}>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="mdi:cog-outline" size={18} /> Configuración avanzada
            <span className="ml-1 text-xs font-normal text-gray-400">{config.configId ? `Configuration ID ${config.configId}` : "Pendiente"}</span>
            <Icon name="mdi:chevron-down" size={18} className="ml-auto transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-gray-100 px-4 pb-4 dark:border-gray-800">
            <ConfiguracionCoexistenciaForm
              key={`${config.appId}:${config.configId ?? ""}`}
              appId={config.appId} configId={config.configId} disabled={busy}
              onSave={async (appId, configId) => {
                unwrapAction(await guardarCoexistenciaConfig(appId, configId));
                setReadyApp(undefined);
                await settings.refetch();
              }}
            />
          </div>
        </details>}
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90"><Icon name="mdi:cellphone-check" size={18} /> Antes de empezar</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            <li className="flex gap-2"><Icon name="mdi:check" size={14} className="mt-0.5 shrink-0 text-success-500" />WhatsApp Business actualizado (2.24.17 o superior) en el celular del número.</li>
            <li className="flex gap-2"><Icon name="mdi:check" size={14} className="mt-0.5 shrink-0 text-success-500" />Ten el celular a mano: Meta mostrará un QR para escanear desde la app.</li>
            <li className="flex gap-2"><Icon name="mdi:check" size={14} className="mt-0.5 shrink-0 text-success-500" />Permite ventanas emergentes de este sitio y desactiva bloqueadores para Facebook.</li>
            <li className="flex gap-2"><Icon name="mdi:check" size={14} className="mt-0.5 shrink-0 text-success-500" />El historial solo puede sincronizarse dentro de las 24 h siguientes al alta.</li>
          </ul>
        </div>
        <details className="rounded-xl border border-gray-200 p-4 text-xs leading-relaxed text-gray-600 dark:border-gray-800 dark:text-gray-400">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">¿Meta dice que “no puede incorporar clientes en este momento”?</summary>
          <p className="mt-2">Ese aviso lo muestra Meta cuando la aplicación aún no está habilitada para conectar números de terceros. Revísalo en Meta for Developers y Business Manager:</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Empresa verificada en el Centro de seguridad.</li>
            <li>App publicada (modo Live) y registrada como Tech Provider.</li>
            <li>Acceso avanzado aprobado para whatsapp_business_management y whatsapp_business_messaging.</li>
            <li>Configuración de tipo WhatsApp Embedded Signup y el dominio del CRM en dominios permitidos.</li>
          </ul>
        </details>
      </aside>
    </div>
  </section>;
}
