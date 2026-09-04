"use server";

import { apiFetch } from "@/src/lib/api";
import type { PipelineConfigResponse } from "./types";

export async function getPipelineConfig(): Promise<PipelineConfigResponse> {
  return apiFetch<PipelineConfigResponse>("/organizations/current/pipeline-config");
}
