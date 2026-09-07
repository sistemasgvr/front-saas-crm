"use server";

import { apiFetch } from "@/src/lib/api";
import { actionErr, actionOk, type ActionResult } from "@/src/lib/action-result";
import type {
  ActualizarActividadAgendaInput,
  ActualizarVisitaAgendaInput,
  AgendaItemRow,
  CrearActividadAgendaInput,
  CrearVisitaAgendaInput,
  GestionarLeadInput,
  VisitaAgendaRow,
} from "./types";

export async function tomarLeadAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch(`/leads/${id}/claim`, { method: "POST" });
    return actionOk();
  } catch (error) {
    return actionErr(error, "No se pudo tomar el lead");
  }
}

export async function asignarLeadAction(
  id: string,
  usuarioId: string,
): Promise<ActionResult> {
  try {
    await apiFetch(`/leads/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ usuarioId }),
    });
    return actionOk();
  } catch (error) {
    return actionErr(error, "No se pudo asignar el lead");
  }
}

export async function liberarLeadAction(id: string): Promise<ActionResult> {
  try {
    await apiFetch(`/leads/${id}/release`, { method: "POST" });
    return actionOk();
  } catch (error) {
    return actionErr(error, "No se pudo liberar el lead");
  }
}

export async function gestionarLeadAction(
  id: string,
  input: GestionarLeadInput,
): Promise<ActionResult> {
  try {
    await apiFetch(`/leads/${id}/gestion`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return actionOk();
  } catch (error) {
    return actionErr(error, "No se pudo actualizar la gestión del lead");
  }
}

export async function crearVisitaAgendaAction(
  input: CrearVisitaAgendaInput,
): Promise<ActionResult<VisitaAgendaRow>> {
  try {
    const data = await apiFetch<VisitaAgendaRow>("/leads/visitas", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return actionOk(data);
  } catch (error) {
    return actionErr(error, "No se pudo registrar la visita");
  }
}

export async function actualizarVisitaAgendaAction(
  visitaId: string,
  input: ActualizarVisitaAgendaInput,
): Promise<ActionResult<VisitaAgendaRow>> {
  try {
    const data = await apiFetch<VisitaAgendaRow>(`/leads/visitas/${visitaId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return actionOk(data);
  } catch (error) {
    return actionErr(error, "No se pudo actualizar la visita");
  }
}

export async function crearActividadAgendaAction(
  input: CrearActividadAgendaInput,
): Promise<ActionResult<AgendaItemRow>> {
  try {
    const data = await apiFetch<AgendaItemRow>("/leads/actividades", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return actionOk(data);
  } catch (error) {
    return actionErr(error, "No se pudo registrar la actividad");
  }
}

export async function actualizarActividadAgendaAction(
  actividadId: string,
  input: ActualizarActividadAgendaInput,
): Promise<ActionResult<AgendaItemRow>> {
  try {
    const data = await apiFetch<AgendaItemRow>(`/leads/actividades/${actividadId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return actionOk(data);
  } catch (error) {
    return actionErr(error, "No se pudo actualizar la actividad");
  }
}
