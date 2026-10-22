"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export const CRM_LOGO_SRC = "/images/logo/logo-crm.png";
export const CRM_LOGO_ALT = "CRM";

interface AppLogoProps {
  logoUrl?: string | null;
  organizationName?: string;
  variant?: "full" | "icon";
  width?: number;
  height?: number;
  className?: string;
  href?: string;
  priority?: boolean;
}

export default function AppLogo({
  logoUrl,
  organizationName,
  variant = "full",
  width = 160,
  height = 40,
  className = "",
  href,
  priority = false,
}: AppLogoProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const custom = !!logoUrl && failedSource !== logoUrl;
  const source = custom ? logoUrl! : CRM_LOGO_SRC;
  const alt = custom
    ? `Logo de ${organizationName ?? "la empresa"}`
    : CRM_LOGO_ALT;
  const onError = () => {
    if (custom) setFailedSource(logoUrl!);
  };
  const content =
    variant === "icon" ? (
      <div
        className={`relative h-9 w-9 shrink-0 overflow-hidden ${className}`}
        aria-hidden={false}
      >
        <Image
          src={source}
          alt={alt}
          width={160}
          height={40}
          priority={priority}
          unoptimized
          onError={onError}
          className={
            custom
              ? "h-9 w-9 object-contain"
              : "absolute left-0 top-1/2 h-9 w-auto max-w-none -translate-y-1/2"
          }
        />
      </div>
    ) : (
      <Image
        src={source}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        onError={onError}
        className={`h-auto max-h-full max-w-full object-contain object-center ${className}`}
        style={{ width, height: custom ? height : "auto", maxHeight: height }}
      />
    );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {content}
      </Link>
    );
  }

  return content;
}
