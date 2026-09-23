export const AuditAction = {
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  REGISTER: "auth.register",
  LOGIN_FAILED: "auth.login_failed",
  GITHUB_SYNC: "github.sync",

  MEMBERSHIP_CREATED: "membership.created",
  MEMBERSHIP_ROLE_UPDATED: "membership.role_updated",
  MEMBERSHIP_DELETED: "membership.deleted",

  ORGANIZATION_UPDATED: "organization.updated",

  INTEGRATION_CONNECTED: "integration.connected",
  INTEGRATION_DISCONNECTED: "integration.disconnected",

  GITHUB_USER_ADDED: "github.user_added",
  GITHUB_USER_REMOVED: "github.user_removed",

  GITHUB_TEAM_ADDED: "github.team_added",
  GITHUB_TEAM_REMOVED: "github.team_removed",

  GITHUB_TEAM_MEMBER_ADDED: "github.team_member_added",
  GITHUB_TEAM_MEMBER_REMOVED: "github.team_member_removed",

  GITHUB_REPOSITORY_PERMISSION_ADDED:
    "github.repository_permission_added",

  GITHUB_REPOSITORY_PERMISSION_CHANGED:
    "github.repository_permission_changed",

  GITHUB_REPOSITORY_PERMISSION_REMOVED:
    "github.repository_permission_removed",
} as const;

export type AuditAction =
  (typeof AuditAction)[keyof typeof AuditAction];