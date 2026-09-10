"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUiState {
  rememberMe: boolean;
  rememberedEmail: string;
  rememberedPassword: string;
  /** Guarda email+contraseña solo para autofill del formulario (no controla duración de sesión). */
  remember: (email: string, password: string) => void;
  forget: () => void;
}

export const useAuthUiStore = create<AuthUiState>()(
  persist(
    (set) => ({
      rememberMe: false,
      rememberedEmail: "",
      rememberedPassword: "",
      remember: (email, password) =>
        set({
          rememberMe: true,
          rememberedEmail: email,
          rememberedPassword: password,
        }),
      forget: () =>
        set({
          rememberMe: false,
          rememberedEmail: "",
          rememberedPassword: "",
        }),
    }),
    { name: "gvr-auth-ui" },
  ),
);
