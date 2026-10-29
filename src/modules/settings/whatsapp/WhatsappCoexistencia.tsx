"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query/keys";
import { unwrapAction } from "@/src/lib/action-result";
import { coexistenciaCode, coexistenciaComplete, coexistenciaConfig, guardarCoexistenciaConfig } from "./coexistencia-actions";
import ConfiguracionCoexistenciaForm from "./ConfiguracionCoexistenciaForm";
import { captureFacebookLoginRedirect } from "./facebook-login-redirect";

type Config = { appId: string; configId: string; version: string };
type Facebook = { init: (config: object) => void; login: (callback: (response: { authResponse?: { code?: string } }) => void, options: object) => void };
type FacebookWindow = Window & { FB?: Facebook; fbAsyncInit?: () => void };

export default function WhatsappCoexistencia() {
  const [config, setConfig] = useState<Config>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const cleanup = useRef<() => void>(() => {});
  const query = useQueryClient();
  const settings = useQuery({ queryKey: ["whatsappCoexistenciaConfig"], queryFn: async () => unwrapAction(await coexistenciaConfig()) });
  useEffect(() => () => cleanup.current(), []);

  async function prepare() {
    setBusy(true); setMessage("");
    try {
      const c = unwrapAction(await coexistenciaConfig());
      if (!c.configId) throw new Error("Guarda el Configuration ID de esta empresa antes de conectar.");
      const w = window as FacebookWindow;
      if (!w.FB) await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("No se pudo cargar Facebook. Revisa el bloqueador del navegador.")), 15000);
        w.fbAsyncInit = () => { window.clearTimeout(timer); resolve(); };
        const script = document.createElement("script");
        script.src = "https://connect.facebook.net/es_LA/sdk.js"; script.async = true;
        script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error("No se pudo cargar Facebook.")); };
        document.body.appendChild(script);
      });
      w.FB!.init({ appId: c.appId, version: c.version, autoLogAppEvents: false, xfbml: false });
      setConfig({ ...c, configId: c.configId });
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo preparar la conexión."); }
    finally { setBusy(false); }
  }

  function launch() {
    if (!config || busy) return;
    cleanup.current(); setBusy(true); setMessage("Completa la conexión en Meta y mantén abierta la app WhatsApp Business del celular.");
    let active = true;
    let session: Promise<{ sessionId: string }> | undefined;
    let asset: { wabaId: string; phoneNumberId?: string } | undefined;
    let completing = false;
    let redirectUri: string | undefined;
    let restoreRedirectCapture = () => {};
    const finish = (text: string) => { if (!active) return; setMessage(text); setBusy(false); cleanup.current(); };
    const timer = window.setTimeout(() => finish("La conexión tardó demasiado. Revisa el resultado en Meta antes de volver a intentarlo."), 15 * 60_000);
    const complete = async () => {
      if (!active || !session || !asset || completing) return;
      completing = true;
      try {
        const s = await session;
        if (!active) return;
        unwrapAction(await coexistenciaComplete(s.sessionId, asset.wabaId, asset.phoneNumberId));
        await Promise.all([query.invalidateQueries({ queryKey: queryKeys.whatsappConexiones }), query.invalidateQueries({ queryKey: queryKeys.whatsappNumerosDisponibles })]);
        finish("Número conectado. Se solicitó la sincronización de contactos e historial autorizado; los mensajes se irán incorporando al CRM.");
      } catch (error) { finish(error instanceof Error ? error.message : "No se pudo completar el alta."); }
    };
    const listener = (event: MessageEvent) => {
      // Orígenes exactos: evilfacebook.com no debe poder completar una sesión.
      if (!active || !["https://www.facebook.com", "https://web.facebook.com", "https://facebook.com"].includes(event.origin)) return;
      let data;
      try { data = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (data.event === "CANCEL" || data.event === "ERROR") { finish("La conexión se canceló o Meta informó un error. Revisa el aviso de Meta."); return; }
      if (data.event !== "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") return;
      if (typeof data.data?.waba_id !== "string" || !/^\d+$/.test(data.data.waba_id)) { finish("Meta no devolvió el identificador de la cuenta. Revisa el alta."); return; }
      asset = { wabaId: data.data.waba_id, phoneNumberId: typeof data.data.phone_number_id === "string" ? data.data.phone_number_id : undefined };
      void complete();
    };
    cleanup.current = () => { active = false; restoreRedirectCapture(); window.clearTimeout(timer); window.removeEventListener("message", listener); };
    window.addEventListener("message", listener);
    try {
      restoreRedirectCapture = captureFacebookLoginRedirect(config.appId, config.configId, uri => { redirectUri = uri; });
      (window as FacebookWindow).FB!.login(response => {
        if (!active || session) return;
        const code = response.authResponse?.code;
        if (!code) { finish("No se recibió la autorización de Meta."); return; }
        if (!redirectUri) { finish("No se pudo identificar la URI del diálogo de Meta. Actualiza la página antes de intentar nuevamente."); return; }
        // El code vence en 30 segundos: enviarlo inmediatamente, aun sin evento FINISH.
        session = coexistenciaCode(code, redirectUri).then(unwrapAction);
        session.catch(error => finish(error instanceof Error ? error.message : "Meta rechazó la autorización."));
        void complete();
      }, { config_id: config.configId, response_type: "code", override_default_response_type: true,
        extras: { setup: {}, featureType: "whatsapp_business_app_onboarding" } });
    } catch { finish("No se pudo abrir Meta. Permite las ventanas emergentes e inténtalo de nuevo."); }
  }

  return <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
    <h2 className="font-semibold">Conectar mi WhatsApp Business del celular</h2>
    <p className="mt-2 text-sm text-gray-500">Conserva tu número y utiliza la app del celular junto con el CRM. Meta te pedirá confirmar la conexión y elegir si compartes el historial.</p>
    {settings.data && <ConfiguracionCoexistenciaForm
      key={`${settings.data.appId}:${settings.data.configId ?? ""}`}
      appId={settings.data.appId} configId={settings.data.configId} disabled={busy}
      onSave={async (appId, configId) => {
        setBusy(true);
        try {
          unwrapAction(await guardarCoexistenciaConfig(appId, configId));
          setConfig(undefined);
          await settings.refetch();
          setMessage('Configuration ID guardado para esta empresa.');
        } finally { setBusy(false); }
      }}
    />}
    {settings.isError && <p role="alert" className="mt-3 text-sm">{settings.error.message}</p>}
    <button type="button" disabled={busy} onClick={config ? launch : prepare} className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white disabled:opacity-50">
      {busy ? "Conectando…" : config ? "Continuar en Meta" : "Preparar conexión con mi número"}
    </button>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}
