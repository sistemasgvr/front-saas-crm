"use client";

import { useQuery } from "@tanstack/react-query";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import { queryKeys } from "@/src/lib/query/keys";
import CreateUserForm from "./CreateUserForm";
import { getAdminOrganizations } from "../organizations/queries";

export default function NewUserView() {
  const { data: organizaciones, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.adminOrganizations,
    queryFn: () => getAdminOrganizations(),
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <QueryError error={error} />;

  return (
    <div>
      <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">Nuevo usuario</h1>
      <CreateUserForm organizaciones={organizaciones ?? []} />
    </div>
  );
}
