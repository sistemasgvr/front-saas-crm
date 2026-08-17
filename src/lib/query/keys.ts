export const queryKeys = {
  me: ["me"] as const,
  organizationCurrent: ["organizations", "current"] as const,
  adminOrganizations: ["admin", "organizations"] as const,
  adminOrganization: (id: string) => ["admin", "organizations", id] as const,
  adminOrganizationModules: (id: string) => ["admin", "organizations", id, "modules"] as const,
  adminUsers: ["admin", "users"] as const,
  adminUser: (id: string) => ["admin", "users", id] as const,
  adminModules: ["admin", "modules"] as const,
};
