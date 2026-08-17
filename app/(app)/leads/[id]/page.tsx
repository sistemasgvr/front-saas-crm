import LeadDetailView from "@/src/modules/leads/LeadDetailView";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadDetailView id={id} />;
}
