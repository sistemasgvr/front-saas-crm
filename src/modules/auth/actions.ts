"use server";

import { publicFetch } from "@/src/lib/api";
import { clearSessionCookies, getRefreshToken, setSessionCookies } from "@/src/lib/session";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  usuario: { esAdminPlataforma: boolean };
};

export async function loginAction(formData: FormData): Promise<{ redirectTo: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";

  if (!email || !password) {
    throw new Error("Ingresa tu email y contraseña");
  }

  let data: LoginResponse;
  try {
    const res = await publicFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Email o contraseña incorrectos");
    }

    data = (await res.json()) as LoginResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("API_URL no está configurada")) throw error;
      if (error.message !== "Email o contraseña incorrectos") {
        throw new Error("No se pudo conectar con el servidor. Verifica que el backend esté activo.");
      }
    }
    throw error;
  }

  await setSessionCookies(data.accessToken, data.refreshToken, rememberMe);

  // Destino inmediato desde la respuesta de login (sin GET /me extra).
  // Clientes van a /dashboard; si no tienen el módulo, esa página redirige.
  const redirectTo = data.usuario.esAdminPlataforma ? "/admin/organizations" : "/dashboard";

  return { redirectTo };
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
