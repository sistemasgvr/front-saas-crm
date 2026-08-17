import { apiFetch } from "@/src/lib/api";
import CreateUserForm from "@/src/modules/admin/users/CreateUserForm";
import type { OrganizacionAdmin } from "@/src/modules/admin/types";

export default async function NewUserPage() {
  const organizaciones = await apiFetch<OrganizacionAdmin[]>("/admin/organizations");

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Nuevo usuario</h1>
      <CreateUserForm organizaciones={organizaciones} />
    </div>
  );
}
