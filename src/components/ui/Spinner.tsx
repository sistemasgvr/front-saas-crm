"use client";

import { Icon } from "@/src/components/ui/Icon";

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Icon name="mdi:loading" size={size} className={`animate-spin ${className ?? ""}`} />;
}
