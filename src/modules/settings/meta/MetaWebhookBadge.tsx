import Badge from "@/src/components/ui/badge/Badge";
import { Icon } from "@/src/components/ui/Icon";

interface MetaWebhookBadgeProps {
  suscrito: boolean;
  size?: "sm" | "md";
}

export default function MetaWebhookBadge({ suscrito, size = "sm" }: MetaWebhookBadgeProps) {
  return (
    <Badge
      color={suscrito ? "success" : "error"}
      size={size}
      startIcon={<Icon name={suscrito ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} size={14} />}
    >
      {suscrito ? "Suscrito" : "Error"}
    </Badge>
  );
}
