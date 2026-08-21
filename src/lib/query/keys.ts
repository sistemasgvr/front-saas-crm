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
  metaPermissions: ["meta", "connection", "permissions"] as const,
  metaPagesVinculadas: (params?: { page?: number }) => ["meta", "pages", "vinculadas", params ?? {}] as const,
  metaPagesVinculadasAll: ["meta", "pages", "vinculadas"] as const,
  metaPagesAvailable: ["meta", "pages", "available"] as const,
  metaPageProfile: (id: string) => ["meta", "pages", "perfil", id] as const,
  metaAdAccountsVinculadas: (params?: { page?: number }) => ["meta", "ad-accounts", "vinculadas", params ?? {}] as const,
  metaAdAccountsVinculadasAll: ["meta", "ad-accounts", "vinculadas"] as const,
  metaAdAccountsAvailable: ["meta", "ad-accounts", "available"] as const,
  metaAdAccountProfile: (id: string) => ["meta", "ad-accounts", "perfil", id] as const,
  metaPageForms: (pageId: string) => ["meta", "pages", pageId, "forms"] as const,
  metaFormsFiltro: (metaPaginaId?: string) => ["meta", "forms", "filtro", metaPaginaId ?? null] as const,
  metaPagesFiltro: ["meta", "pages", "filtro"] as const,
  metaAdAccountsFiltro: ["meta", "ad-accounts", "filtro"] as const,
  metaCampaigns: ["meta", "campaigns"] as const,
  metaAdsets: ["meta", "adsets"] as const,
  metaAds: ["meta", "ads"] as const,
  leads: (filtro: Record<string, string | number | undefined>) => ["leads", filtro] as const,
  lead: (id: string) => ["leads", id] as const,
  leadsAll: ["leads"] as const,
  notifications: (params?: { page?: number }) => ["notifications", params ?? {}] as const,
  /** Prefijo para invalidar todas las páginas a la vez (no usar para fetch). */
  notificationsAll: ["notifications"] as const,
  notificationsUnreadCount: ["notifications", "unread-count"] as const,
};
