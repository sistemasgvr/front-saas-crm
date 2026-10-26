"use client";

import { toast } from "sonner";
import { errorMessage } from "./error-message";

/** Los formularios sin React Query también deben mostrar los errores esperados. */
export function withFormFeedback(action: () => Promise<unknown>) {
  return async () => {
    try {
      await action();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
}
