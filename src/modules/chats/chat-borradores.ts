"use client";

/**
 * API pública de borradores — reexporta el store Zustand.
 * Los callers existentes (ChatDetailView, ChatsSidebar) no cambian de path.
 */
export {
  useChatBorradoresStore,
  useChatBorradores,
  useBorradorChat,
  getBorrador,
  setBorrador,
  clearBorrador,
  type BorradoresPorChat,
} from "@/src/stores/chat-borradores.store";
