"use server";

import { apiFetch } from "@/src/lib/api";
import type { MetaConnection, MetaOption } from "./types";

export async function getMetaConnection() {
  return apiFetch<MetaConnection>("/meta/connections/current");
}

export async function getMetaPages() {
  return apiFetch<MetaOption[]>("/meta/connections/pages");
}

export async function getMetaAdAccounts() {
  return apiFetch<MetaOption[]>("/meta/connections/ad-accounts");
}
