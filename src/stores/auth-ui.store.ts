"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUiState {
  rememberMe: boolean;
  rememberedEmail: string;
  remember: (email: string) => void;
  forget: () => void;
}

export const useAuthUiStore = create<AuthUiState>()(
  persist(
    (set) => ({
      rememberMe: false,
      rememberedEmail: "",
      remember: (email) => set({ rememberMe: true, rememberedEmail: email }),
      forget: () => set({ rememberMe: false, rememberedEmail: "" }),
    }),
    { name: "gvr-auth-ui" },
  ),
);
