"use server";

import { apiFetch } from "@/src/lib/api";
import type { LeadAutoAsignacionConfig } from "./types";

export async function getLeadAutoAsignacionConfig(): Promise<LeadAutoAsignacionConfig> {
  return apiFetch<LeadAutoAsignacionConfig>("/leads/auto-asignacion/config");
}

