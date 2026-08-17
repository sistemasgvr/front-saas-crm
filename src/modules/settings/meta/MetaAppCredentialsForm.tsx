"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Label from "@/src/components/form/Label";
import Input from "@/src/components/form/input/InputField";
import PasswordInput from "@/src/components/form/input/PasswordInput";
import Button from "@/src/components/ui/button/Button";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import { saveMetaAppCredentialsAction } from "./actions";

const schema = z.object({
  appId: z.string().min(5, "Ingresa el App ID de tu Meta App"),
  appSecret: z.string().min(10, "Ingresa el App Secret de tu Meta App"),
});

type Values = z.infer<typeof schema>;

interface MetaAppCredentialsFormProps {
  appIdActual?: string | null;
}

export default function MetaAppCredentialsForm({ appIdActual }: MetaAppCredentialsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { appId: appIdActual ?? "", appSecret: "" },
  });

  const mutation = useAppMutation({
    mutationFn: (values: Values) => saveMetaAppCredentialsAction(values.appId, values.appSecret),
    successMessage: "Credenciales de Meta App guardadas",
    invalidateKeys: [queryKeys.metaConnection],
  });

  return (
    <div className="space-y-4">
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        Registra tu propia Meta App (creada en{" "}
        <span className="text-gray-700 dark:text-gray-300">developers.facebook.com</span>) para conectar tus
        páginas y campañas. El App Secret se guarda cifrado y nunca se muestra de nuevo.
      </p>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
        <fieldset disabled={mutation.isPending} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="appId">App ID *</Label>
            <Input id="appId" error={Boolean(errors.appId)} hint={errors.appId?.message} {...register("appId")} />
          </div>
          <div>
            <Label htmlFor="appSecret">App Secret *</Label>
            <PasswordInput
              id="appSecret"
              error={Boolean(errors.appSecret)}
              hint={errors.appSecret?.message ?? (appIdActual ? "Vuelve a ingresarlo para actualizarlo" : undefined)}
              {...register("appSecret")}
            />
          </div>
        </fieldset>
        <Button type="submit" size="sm" loading={mutation.isPending}>
          {appIdActual ? "Actualizar credenciales" : "Guardar credenciales"}
        </Button>
      </form>
    </div>
  );
}
