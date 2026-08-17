"use server";

import { getMe } from "@/src/lib/auth";

export async function getMeQuery() {
  const me = await getMe();
  if (!me) {
    throw new Error("Sin sesión activa");
  }
  return me;
}
