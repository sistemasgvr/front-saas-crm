/** Facebook genera una URI interna distinta para cada popup. Observar la
 * petición real (GET o formulario POST) solo durante el lanzamiento del SDK,
 * sin cambiar su URL, sus parámetros ni su comportamiento. */
export function captureFacebookLoginRedirect(
  appId: string,
  configId: string,
  onRedirect: (uri: string) => void,
): () => void {
  const originalOpen = window.open;
  const originalSubmit = HTMLFormElement.prototype.submit;
  let restored = false;
  const inspect = (url: string, fields?: FormData) => {
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.protocol !== "https:" || !["www.facebook.com", "web.facebook.com", "facebook.com", "m.facebook.com"].includes(parsed.hostname)
        || !/^\/(?:v\d+\.\d+\/)?dialog\/oauth\/?$/.test(parsed.pathname)) return;
      const params = parsed.searchParams;
      if (fields) for (const [key, value] of fields.entries()) if (typeof value === "string") params.set(key, value);
      if ((params.get("app_id") ?? params.get("client_id")) !== appId || params.get("config_id") !== configId) return;
      const uri = params.get("redirect_uri");
      if (!uri) return;
      restore();
      onRedirect(uri);
    } catch { /* No interferir en otras ventanas o formularios. */ }
  };
  const open: typeof window.open = function (url, target, features) {
    if (url) inspect(String(url));
    return originalOpen.call(window, url, target, features);
  };
  const submit = function (this: HTMLFormElement) {
    inspect(this.action, new FormData(this));
    return originalSubmit.call(this);
  };
  const restore = () => {
    if (restored) return;
    restored = true;
    window.clearTimeout(timer);
    if (window.open === open) window.open = originalOpen;
    if (HTMLFormElement.prototype.submit === submit) HTMLFormElement.prototype.submit = originalSubmit;
  };
  const timer = window.setTimeout(restore, 10000);
  window.open = open;
  HTMLFormElement.prototype.submit = submit;
  return restore;
}
