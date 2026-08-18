import PageHeader from "@/src/components/ui/PageHeader";
import CreateOrganizationForm from "@/src/modules/admin/organizations/CreateOrganizationForm";

export default function NewOrganizationPage() {
  return (
    <div>
      <PageHeader
        title="Nueva empresa"
        description="Alta de organización y de su primer usuario."
        backHref="/admin/organizations"
        backLabel="Volver a empresas"
      />
      <CreateOrganizationForm />
    </div>
  );
}
