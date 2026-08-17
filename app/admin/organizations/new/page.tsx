import CreateOrganizationForm from "@/src/modules/admin/organizations/CreateOrganizationForm";

export default function NewOrganizationPage() {
  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Nueva empresa</h1>
      <CreateOrganizationForm />
    </div>
  );
}
