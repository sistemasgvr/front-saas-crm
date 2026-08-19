"use client";

import { useState } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import Button from "@/src/components/ui/button/Button";
import { Icon } from "@/src/components/ui/Icon";
import EmptyState from "@/src/components/ui/EmptyState";
import { QueryError } from "@/src/components/ui/PageLoader";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";

export interface MetaLinkResourceItem {
  id: string;
  nombre: string;
}

interface MetaLinkResourcePanelProps {
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

export default function MetaLinkResourcePanel({
  title,
  icon,
  loadingLabel,
  emptyMessage,
  queryKey,
  queryFn,
  onLink,
  successMessage,
  invalidateKeys,
}: MetaLinkResourcePanelProps) {
  const [open, setOpen] = useState(false);

  const availableQuery = useQuery({
    queryKey,
    queryFn,
    enabled: open,
  });

  const vincular = useAppMutation({
    mutationFn: onLink,
    successMessage,
    invalidateKeys,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.02]"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon name={icon} size={20} />
          </span>
          <span>
            <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{title}</span>
            <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
              Vincula recursos disponibles en tu cuenta Meta conectada
            </span>
          </span>
        </span>
        <Icon name={open ? "mdi:chevron-up" : "mdi:chevron-down"} size={20} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          {availableQuery.isLoading && (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">{loadingLabel}</p>
          )}
          {availableQuery.isError && <QueryError error={availableQuery.error} />}
          {availableQuery.data?.length === 0 && (
            <EmptyState icon="mdi:link-off" title={emptyMessage} />
          )}
          <div className="space-y-2">
            {(availableQuery.data ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800"
              >
                <span className="min-w-0 truncate text-theme-sm text-gray-700 dark:text-gray-300">{item.nombre}</span>
                <Button
                  type="button"
                  size="sm"
                  loading={vincular.isPending}
                  startIcon={<Icon name="mdi:link-plus" size={16} />}
                  onClick={() => vincular.mutate(item)}
                >
                  Vincular
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
