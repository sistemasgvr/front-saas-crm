"use client";

import type { ReactNode } from "react";
import type { QueryKey } from "@tanstack/react-query";
import Button from "@/src/components/ui/button/Button";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";

interface ActionButtonProps {
  action: () => Promise<void>;
  successMessage: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
  loadingText?: string;
  startIcon?: ReactNode;
  invalidateKeys?: QueryKey[];
}

export default function ActionButton({
  action,
  successMessage,
  children,
  variant = "outline",
  size = "sm",
  className,
  loadingText,
  startIcon,
  invalidateKeys,
}: ActionButtonProps) {
  const mutation = useAppMutation({
    mutationFn: () => action(),
    successMessage,
    invalidateKeys,
  });

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      startIcon={startIcon}
      loading={mutation.isPending}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending && loadingText ? loadingText : children}
    </Button>
  );
}
