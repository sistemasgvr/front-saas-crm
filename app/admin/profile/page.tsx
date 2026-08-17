import { getMe } from "@/src/lib/auth";
import ProfileForms from "@/src/modules/profile/ProfileForms";

export default async function AdminProfilePage() {
  const me = await getMe();

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Perfil</h1>
      <ProfileForms
        email={me?.usuario.email ?? ""}
        nombre={me?.usuario.nombre ?? ""}
        apellido={me?.usuario.apellido ?? null}
        telefono={me?.usuario.telefono ?? null}
      />
    </div>
  );
}
