"use server";

import { apiFetch } from "@/src/lib/api";
import type { ModuloAdmin } from "../types";

export async function getAdminModules() {
  return apiFetch<ModuloAdmin[]>("/admin/modules");
}
