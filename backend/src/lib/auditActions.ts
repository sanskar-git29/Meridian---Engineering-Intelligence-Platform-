export const AuditAction = {
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",

  REGISTER: "auth.register",
  LOGIN_FAILED: "auth.login_failed",

  MEMBERSHIP_CREATED: "membership.created",
  MEMBERSHIP_ROLE_UPDATED: "membership.role_updated",
  MEMBERSHIP_DELETED: "membership.deleted",

  ORGANIZATION_UPDATED: "organization.updated",

  INTEGRATION_CONNECTED: "integration.connected",
  INTEGRATION_DISCONNECTED: "integration.disconnected",
} as const;

export type AuditAction =
  (typeof AuditAction)[keyof typeof AuditAction];