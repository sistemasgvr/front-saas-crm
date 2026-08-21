"use client";

import Link from "next/link";
import { Icon } from "@/src/components/ui/Icon";

interface TableActionProps {
  href?: string;
  onClick?: () => void;
  icon: string;
  label: string;
  variant?: "default" | "danger";
  className?: string;
}

const styles = {
  default:
    "text-gray-500 hover:bg-brand-50 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400",
  danger:
    "text-gray-500 hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400",
};

export default function TableAction({ href, onClick, icon, label, variant = "default", className = "" }: TableActionProps) {
  const classes =
    `inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${styles[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={classes}>
        <Icon name={icon} size={18} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={classes}>
      <Icon name={icon} size={18} />
    </button>
  );
}
