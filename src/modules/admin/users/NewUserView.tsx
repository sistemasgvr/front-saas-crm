"use client";

import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import CreateUserForm from "./CreateUserForm";
import { getAdminOrganizations } from "../organizations/queries";

export default function NewUserView() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminOrganizations({ page: 1, pageSize: 100, estado: 1 }),
    queryFn: () => getAdminOrganizations({ page: 1, pageSize: 100, estado: 1 }),
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;

  return (
    <div>
      <PageHeader
        title="Nuevo usuario"
        description="Crea una cuenta y asígnala a una empresa."
        backHref="/admin/users"
        backLabel="Volver a usuarios"
      />
      <CreateUserForm organizaciones={data?.data ?? []} />
    </div>
  );
}
