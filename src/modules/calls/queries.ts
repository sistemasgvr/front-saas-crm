"use server";

import { apiFetch } from "@/src/lib/api";
import {
  normalizarCapacidad,
  normalizarPermiso,
  type CallSettingsResponse,
  type CapacidadCalling,
  type CapacidadCallingApi,
  type IceServersResponse,
  type ListarLlamadasFiltro,
  type ListarLlamadasResultado,
  type MetricasLlamadas,
  type PermisoLlamada,
  type PermisoLlamadaApi,
  type PresenciaLlamadas,
  type WhatsappLlamada,
} from "./types";

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function getCapacidadCalling(): Promise<CapacidadCalling> {
  const data = await apiFetch<CapacidadCallingApi>("/whatsapp/calls/capacidad");
  return normalizarCapacidad(data);
}

export async function getIceServers(): Promise<IceServersResponse> {
  return apiFetch<IceServersResponse>("/whatsapp/calls/ice-servers");
}

export async function getPresencia(): Promise<PresenciaLlamadas> {
  return apiFetch<PresenciaLlamadas>("/whatsapp/calls/presencia");
}

export async function listarLlamadas(
  filtro: ListarLlamadasFiltro = {},
): Promise<ListarLlamadasResultado> {
  const q = buildQuery({
    desde: filtro.desde,
    hasta: filtro.hasta,
    asesorId: filtro.asesorId,
    resultado: filtro.resultado,
    leadId: filtro.leadId,
    conversacionId: filtro.conversacionId,
    page: filtro.page,
  });
  const data = await apiFetch<ListarLlamadasResultado>(`/whatsapp/calls${q}`);
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
  };
}

export async function getLlamada(id: string): Promise<WhatsappLlamada> {
  return apiFetch<WhatsappLlamada>(`/whatsapp/calls/${id}`);
}

export async function getPermisoLlamada(params: {
  conversacionId?: string;
  waId?: string;
}): Promise<PermisoLlamada> {
  const q = buildQuery({
    conversacionId: params.conversacionId,
    waId: params.waId,
  });
  try {
    const data = await apiFetch<PermisoLlamadaApi>(`/whatsapp/calls/permiso${q}`);
    return normalizarPermiso(data);
  } catch {
    return { status: "no_permission", expirationTime: null, puedeLlamar: false };
  }
}

export async function getCallSettings(conexionId?: string): Promise<CallSettingsResponse> {
  const q = buildQuery({ conexionId });
  return apiFetch<CallSettingsResponse>(`/whatsapp/calls/settings${q}`);
}

export async function getMetricasLlamadas(params?: {
  desde?: string;
  hasta?: string;
}): Promise<MetricasLlamadas> {
  const q = buildQuery({ desde: params?.desde, hasta: params?.hasta });
  return apiFetch<MetricasLlamadas>(`/whatsapp/calls/metricas${q}`);
}
