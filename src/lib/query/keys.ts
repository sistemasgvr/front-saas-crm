export const queryKeys = {
  me: ["me"] as const,
  organizationCurrent: ["organizations", "current"] as const,
  adminOrganizations: ["admin", "organizations"] as const,
  adminOrganization: (id: string) => ["admin", "organizations", id] as const,
  adminOrganizationModules: (id: string) => ["admin", "organizations", id, "modules"] as const,
  adminUsers: ["admin", "users"] as const,
  adminUser: (id: string) => ["admin", "users", id] as const,
  adminModules: ["admin", "modules"] as const,
  metaConnection: ["meta", "connection"] as const,
  metaPages: ["meta", "pages"] as const,
  metaAdAccounts: ["meta", "ad-accounts"] as const,
};
