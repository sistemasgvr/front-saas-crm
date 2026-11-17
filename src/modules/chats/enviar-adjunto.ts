// Vercel admite 4,5 MB incluyendo los campos y el boundary del multipart.
const MAX_MULTIPART_ARCHIVO = 4 * 1024 * 1024;
const ERROR_SIN_CONFIRMACION =
  "No se pudo confirmar el envío del archivo. Revisa el chat antes de volver a enviarlo.";

async function solicitarCarga(endpoint: string, body: FormData | string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      body,
      headers: typeof body === "string" ? { "Content-Type": "application/json" } : undefined,
      redirect: "manual",
    });
  } catch {
    throw new Error(ERROR_SIN_CONFIRMACION);
  }
  if (response.ok) return response;
  if (response.status === 401) {
    throw new Error("Tu sesión venció. Inicia sesión e intenta enviar el archivo de nuevo.");
  }
  const data = await response.json().catch(() => null);
  if (typeof data?.message === "string" && data.message.trim()) {
    throw new Error(data.message);
  }
  if (response.status === 413) {
    throw new Error("El archivo supera el tamaño permitido para esta carga. Elige un archivo más liviano.");
  }
  throw new Error(ERROR_SIN_CONFIRMACION);
}

export async function enviarAdjunto(conversacionId: string, body: FormData): Promise<void> {
  const endpoint = `/api/whatsapp/chats/${encodeURIComponent(conversacionId)}/media`;
  const archivo = body.get("archivo");
  if (!(archivo instanceof File)) throw new Error("Selecciona un archivo para enviar.");
  if (archivo.size <= MAX_MULTIPART_ARCHIVO) {
    const response = await solicitarCarga(endpoint, body);
    if (response.status !== 204) throw new Error(ERROR_SIN_CONFIRMACION);
    return;
  }

  const metadata = { mimeType: archivo.type, tamanoBytes: archivo.size };
  const preparacion = await solicitarCarga(`${endpoint}?fase=preparar`, JSON.stringify(metadata));
  const carga = await preparacion.json().catch(() => null);
  if (typeof carga?.url !== "string" || typeof carga.cargaId !== "string") {
    throw new Error("No se pudo preparar la carga del archivo. Intenta de nuevo.");
  }

  const errorCarga = "No se pudo cargar el archivo. Revisa tu conexión e intenta de nuevo.";
  const subida = await fetch(carga.url, {
    method: "PUT",
    body: archivo,
    headers: { "Content-Type": archivo.type, "If-None-Match": "*" },
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
  }).catch(() => { throw new Error(errorCarga); });
  if (!subida.ok && subida.status !== 412) {
    if (subida.status === 413) {
      throw new Error("El almacenamiento rechazó el tamaño del archivo. Elige un archivo más liviano.");
    }
    throw new Error(errorCarga);
  }

  const response = await solicitarCarga(`${endpoint}?fase=confirmar`, JSON.stringify({
    ...metadata,
    cargaId: carga.cargaId,
    nombreArchivo: archivo.name,
    caption: body.get("caption") ?? undefined,
    respondeAMensajeId: body.get("respondeAMensajeId") ?? undefined,
    esVoz: body.get("esVoz") ?? undefined,
  }));
  if (response.status !== 204) throw new Error(ERROR_SIN_CONFIRMACION);
}
