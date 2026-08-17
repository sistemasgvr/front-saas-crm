'use server';

import { redirect } from 'next/navigation';
import { publicFetch } from '@/src/lib/api';
import { clearSessionCookies, getRefreshToken, setSessionCookies } from '@/src/lib/session';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Ingresa tu email y contraseña' };
  }

  let accessToken: string;
  let refreshToken: string;
  try {
    const res = await publicFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return { error: 'Email o contraseña incorrectos' };
    }

    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
  } catch {
    return { error: 'No se pudo conectar con el servidor' };
  }

  await setSessionCookies(accessToken, refreshToken);

  let isAdmin = false;
  try {
    const meRes = await fetch(`${process.env.API_URL ?? 'http://localhost:4000/api'}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (meRes.ok) {
      const me = (await meRes.json()) as { usuario?: { esAdminPlataforma?: boolean } };
      isAdmin = Boolean(me.usuario?.esAdminPlataforma);
    }
  } catch {
    isAdmin = false;
  }

  redirect(isAdmin ? '/admin/organizations' : '/dashboard');
}

export async function logoutAction() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await publicFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  await clearSessionCookies();
  redirect('/login');
}
