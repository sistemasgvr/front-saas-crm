import type { PaginatedResult } from "@/src/lib/pagination";
import type { ConversacionResumen } from "./types";

export type ChatListCache = ConversacionResumen[] | PaginatedResult<ConversacionResumen>;

export function updateChatList(
  cache: ChatListCache | undefined,
  update: (items: ConversacionResumen[]) => ConversacionResumen[],
): ChatListCache | undefined {
  if (!cache) return cache;
  return Array.isArray(cache) ? update(cache) : { ...cache, data: update(cache.data) };
}
