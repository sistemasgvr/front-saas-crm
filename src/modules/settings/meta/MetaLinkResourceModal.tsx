"use client";

import type { QueryKey } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import Button from "@/src/components/ui/button/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/ui/Icon";
import Modal from "@/src/components/ui/modal/Modal";
import ModalHeading from "@/src/components/ui/modal/ModalHeading";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import Pagination from "@/src/components/ui/Pagination";
import { useClientPagination } from "@/src/components/ui/use-client-pagination";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";

export interface MetaLinkResourceItem {
  id: string;
  nombre: string;
}

interface MetaLinkResourceModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  loadingLabel: string;
  emptyMessage: string;
  queryKey: QueryKey;
  queryFn: () => Promise<MetaLinkResourceItem[]>;
  onLink: (item: MetaLinkResourceItem) => Promise<void>;
  successMessage: string;
  invalidateKeys: QueryKey[];
}

/** Lista los recursos de la cuenta Meta conectada que aún no están vinculados. */
export default function MetaLinkResourceModal({
  open,
  onClose,
  title,
  icon,
  loadingLabel,
  emptyMessage,
  queryKey,
  queryFn,
  onLink,
  successMessage,
  invalidateKeys,
}: MetaLinkResourceModalProps) {
  const availableQuery = useQuery({
    queryKey,
    queryFn,
    enabled: open,
  });

  const availablePage = useClientPagination(availableQuery.data ?? []);
  const vincular = useAppMutation({
    mutationFn: onLink,
    successMessage,
    invalidateKeys,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-[600px]"
      header={<ModalHeading title={title} icon={icon} />}
    >
      <div className="px-5 py-5 sm:px-6">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Recursos disponibles en tu cuenta Meta conectada que todavía no están vinculados al CRM.
        </p>

        {availableQuery.isLoading && <PageLoader label={loadingLabel} />}
        {availableQuery.isError && <QueryError error={availableQuery.error} />}
        {availableQuery.data?.length === 0 && <EmptyState icon="mdi:link-off" title={emptyMessage} />}

        {availablePage.items.length > 0 && (
          <ul className="divide-y divide-gray-100 border-y border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            {availablePage.items.map((item) => {
              const vinculando = vincular.isPending && vincular.variables?.id === item.id;
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {item.nombre}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    loading={vinculando}
                    disabled={vincular.isPending}
                    startIcon={<Icon name="mdi:link-plus" size={16} />}
                    onClick={() => vincular.mutate(item)}
                  >
                    Vincular
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination {...availablePage.pagination} itemLabel="recursos" className="mt-4" />
      </div>
    </Modal>
  );
}
