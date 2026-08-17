"use server";

import { apiFetch } from "@/src/lib/api";
import type { OrganizacionActual } from "./types";

export async function getCurrentOrganization() {
  return apiFetch<OrganizacionActual>("/organizations/current");
}
