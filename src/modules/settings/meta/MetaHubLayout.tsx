"use client";

import type { ReactNode } from "react";
import PageHeader from "@/src/components/ui/PageHeader";
import MetaHubTabs from "./MetaHubTabs";

interface MetaHubLayoutProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  headerActions?: ReactNode;
  showTabs?: boolean;
  children: ReactNode;
}

export default function MetaHubLayout({
  title,
  description,
  backHref = "/settings",
  backLabel = "Volver a configuración",
  headerActions,
  showTabs = true,
  children,
}: MetaHubLayoutProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} backHref={backHref} backLabel={backLabel}>
        {headerActions}
      </PageHeader>
      {showTabs && <MetaHubTabs />}
      {children}
    </div>
  );
}
