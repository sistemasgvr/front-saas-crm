"use server";

import { ApiError, publicFetch } from "@/src/lib/api";
import { actionOk, type ActionResult } from "@/src/lib/action-result";
import { clearSessionCookies, getRefreshToken, setSessionCookies } from "@/src/lib/session";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  usuario: { esAdminPlataforma: boolean; debeCambiarPassword: boolean };
};

export async function loginAction(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Ingresa tu email y contraseña" };
  }

  let data: LoginResponse;
  try {
    const res = await publicFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = res.status === 401
        ? "Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo."
        : res.status === 400
          ? "Revisa el formato del correo y completa la contraseña."
          : res.status === 429
            ? "Demasiados intentos. Espera unos minutos e intenta de nuevo."
            : "No se pudo iniciar sesión por un problema del servidor. Intenta de nuevo en unos segundos.";
      return { ok: false, error };
    }

    data = (await res.json()) as LoginResponse;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof ApiError && (error.status === 0 || error.status === 408)
        ? error.message
        : "No se pudo iniciar sesión por un problema del servidor. Intenta de nuevo en unos segundos.",
    };
  }

  // Siempre persistir cookies (~24h). "Recordar email" solo afecta el store UI del formulario.
  await setSessionCookies(data.accessToken, data.refreshToken, true);

  // Destino inmediato desde la respuesta de login (sin GET /me extra).
  // Clientes van a /dashboard; si no tienen el módulo, esa página redirige.
  const redirectTo = data.usuario.debeCambiarPassword ? '/cambiar-password' : data.usuario.esAdminPlataforma ? "/admin/organizations" : "/dashboard";

  return actionOk({ redirectTo });
}

export async function logoutAction() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await publicFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  await clearSessionCookies();
}
