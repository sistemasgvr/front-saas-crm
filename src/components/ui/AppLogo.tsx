import Image from "next/image";
import Link from "next/link";

export const CRM_LOGO_SRC = "/images/logo/logo-crm.png";
export const CRM_LOGO_ALT = "CRM";

interface AppLogoProps {
  variant?: "full" | "icon";
  width?: number;
  height?: number;
  className?: string;
  href?: string;
  priority?: boolean;
}

export default function AppLogo({
  variant = "full",
  width = 160,
  height = 40,
  className = "",
  href,
  priority = false,
}: AppLogoProps) {
  const content =
    variant === "icon" ? (
      <div className={`relative h-9 w-9 shrink-0 overflow-hidden ${className}`} aria-hidden={false}>
        <Image
          src={CRM_LOGO_SRC}
          alt={CRM_LOGO_ALT}
          width={160}
          height={40}
          priority={priority}
          unoptimized
          className="absolute left-0 top-1/2 h-9 w-auto max-w-none -translate-y-1/2"
        />
      </div>
    ) : (
      <Image
        src={CRM_LOGO_SRC}
        alt={CRM_LOGO_ALT}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className={`h-auto max-w-full object-contain ${className}`}
        style={{ width, height: "auto" }}
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
