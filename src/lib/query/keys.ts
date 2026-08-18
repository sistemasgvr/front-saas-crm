export const queryKeys = {
  me: ["me"] as const,
  organizationCurrent: ["organizations", "current"] as const,
  adminOrganizations: (params?: { page?: number; pageSize?: number; q?: string; estado?: number }) =>
    ["admin", "organizations", params ?? {}] as const,
  /** Prefijo para invalidar todas las páginas/tamaños a la vez (no usar para fetch). */
  adminOrganizationsAll: ["admin", "organizations"] as const,
  adminOrganization: (id: string) => ["admin", "organizations", id] as const,
  adminOrganizationModules: (id: string) => ["admin", "organizations", id, "modules"] as const,
  adminUsers: (params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    estado?: number;
    esAdminPlataforma?: number;
  }) => ["admin", "users", params ?? {}] as const,
  /** Prefijo para invalidar todas las páginas/tamaños a la vez (no usar para fetch). */
  adminUsersAll: ["admin", "users"] as const,
  adminUser: (id: string) => ["admin", "users", id] as const,
  adminModules: ["admin", "modules"] as const,
  metaConnection: ["meta", "connection"] as const,
  metaPages: ["meta", "pages"] as const,
  metaAdAccounts: ["meta", "ad-accounts"] as const,
  metaCampaigns: ["meta", "campaigns"] as const,
  metaAdsets: ["meta", "adsets"] as const,
  metaAds: ["meta", "ads"] as const,
  leads: (filtro: Record<string, string | number | undefined>) => ["leads", filtro] as const,
  lead: (id: string) => ["leads", id] as const,
};
