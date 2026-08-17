import OrganizationDetailView from "@/src/modules/admin/organizations/OrganizationDetailView";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizationDetailView id={id} />;
}
