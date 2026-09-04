"use server";

import { apiFetch } from "@/src/lib/api";
import type {
  FiltroInmuebles,
  InmuebleFiltroOption,
  InmuebleRow,
  ListaInmueblesResultado,
} from "./types";

function toSearch(params?: FiltroInmuebles) {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? 1));
  search.set("pageSize", String(params?.pageSize ?? 20));
  if (params?.q) search.set("q", params.q);
  if (params?.tipo) search.set("tipo", params.tipo);
  if (params?.operacion) search.set("operacion", params.operacion);
  if (params?.estadoInmueble) search.set("estadoInmueble", params.estadoInmueble);
  if (params?.zona) search.set("zona", params.zona);
  return search.toString();
}

export async function getInmuebles(params?: FiltroInmuebles) {
  return apiFetch<ListaInmueblesResultado>(`/inmuebles?${toSearch(params)}`);
}

export async function getInmueble(id: string) {
  return apiFetch<InmuebleRow>(`/inmuebles/${id}`);
}

/** Lista liviana para selects de visitas / pipeline. */
export async function getInmueblesFiltro() {
  return apiFetch<InmuebleFiltroOption[]>("/inmuebles/filtro");
}
