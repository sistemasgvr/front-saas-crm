import { getMe } from "@/src/lib/auth";
import PageHeader from "@/src/components/ui/PageHeader";
import ProfileForms from "@/src/modules/profile/ProfileForms";

export default async function AdminProfilePage() {
  const me = await getMe();

  return (
    <div>
      <PageHeader title="Perfil" description="Tus datos personales y contraseña." />
      <ProfileForms
        email={me?.usuario.email ?? ""}
        nombre={me?.usuario.nombre ?? ""}
        apellido={me?.usuario.apellido ?? null}
        telefono={me?.usuario.telefono ?? null}
      />
    </div>
  );
}
