"use server";

import { publicFetch } from "@/src/lib/api";
import { clearSessionCookies, getRefreshToken, setSessionCookies } from "@/src/lib/session";

export async function loginAction(formData: FormData): Promise<{ isAdmin: boolean }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";

  if (!email || !password) {
    throw new Error("Ingresa tu email y contraseña");
  }

  let accessToken: string;
  let refreshToken: string;
  try {
    const res = await publicFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Email o contraseña incorrectos");
    }

    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  } catch (error) {
    if (error instanceof Error && error.message !== "Email o contraseña incorrectos") {
      throw new Error("No se pudo conectar con el servidor");
    }
    throw error;
  }

  await setSessionCookies(accessToken, refreshToken, rememberMe);

  let isAdmin = false;
  try {
    const meRes = await fetch(`${process.env.API_URL ?? "http://localhost:4000/api"}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as { usuario?: { esAdminPlataforma?: boolean } };
      isAdmin = Boolean(me.usuario?.esAdminPlataforma);
    }
  } catch {
    isAdmin = false;
  }

  return { isAdmin };
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
