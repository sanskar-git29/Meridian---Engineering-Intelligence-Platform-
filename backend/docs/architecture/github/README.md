# 04 — GitHub Collaboration Security

## 1. Purpose

This document defines the security model for Medit's GitHub Collaboration backend.

The backend is the authoritative security boundary.

Frontend restrictions are for user experience only and must never be treated as authorization.

---

# 2. Security Model

Every protected request follows:

```text
Authentication
      ↓
Organization Membership
      ↓
Role / Team Authorization
      ↓
Resource Authorization
      ↓
Operation
```

A request must pass every applicable layer.

---

# 3. Authentication

Every protected GitHub Collaboration endpoint requires an authenticated Medit user.

The backend must establish the authenticated user from the existing authentication mechanism.

Never accept the authenticated user's identity from the request body.

Do not trust:

```text
userId
organizationId
role
```

supplied by the frontend as proof of identity or authority.

---

# 4. Organization Isolation

Organizations are strict security boundaries.

A user belonging to:

```text
Organization A
```

must never access resources belonging to:

```text
Organization B
```

This applies to:

* teams
* repositories
* team memberships
* team-repository relationships
* GitHub installations
* sync jobs
* engineering data
* audit records

Every resource query must be scoped to the authenticated organization.

---

# 5. Organization Context

The backend derives the active organization from authenticated server-side context.

The frontend must not be allowed to select an arbitrary organization simply by sending:

```json
{
  "organizationId": "another-org"
}
```

If an endpoint accepts an organization identifier for a legitimate reason, the backend must independently verify that the authenticated user belongs to that organization and has the required authority.

---

# 6. Roles

Medit uses:

```text
OWNER
MANAGER
MEMBER
```

## OWNER

Organization-level administrative authority.

Can:

* connect GitHub
* disconnect GitHub
* initialize repositories
* de-initialize repositories
* create teams
* update teams
* delete teams
* add/remove team members
* assign repositories to teams
* change team repository permissions
* view synchronization state
* retry synchronization
* trigger reconciliation
* view authorized engineering data

## MANAGER

Manager has the same GitHub management capabilities as Owner for v1.

The Manager does not own the GitHub organization.

The GitHub App installation remains associated with the client's GitHub organization.

Replacing a Manager must not:

* reinstall the GitHub App
* transfer GitHub ownership
* recreate teams
* recreate repositories
* change historical data

## MEMBER

Members are read-only.

Members may access:

* teams they belong to
* repositories authorized through those teams
* engineering data belonging to those repositories

Members cannot perform GitHub management operations.

---

# 7. Repository as Engineering Security Boundary

Repository authorization is the primary boundary for engineering data.

If a member can access:

```text
Repository A
```

they may see engineering information belonging to Repository A.

This includes:

* pull requests
* PR authors
* PR reviewers
* commits
* CI/CD
* reviews
* repository activity

The team of the person who created the activity does not determine visibility.

The repository does.

---

# 8. Team Membership Does Not Automatically Grant Repository Access

Being a member of:

```text
Team A
```

does not automatically grant access to every repository.

Access exists only when:

```text
TeamMembership = ACTIVE
```

and:

```text
TeamRepository = ACTIVE
```

for the repository.

Therefore:

```text
User
 ↓
Active Team Membership
 ↓
Active TeamRepository
 ↓
Repository Access
```

---

# 9. Effective Repository Permission

A user may belong to multiple teams.

Example:

```text
Team A → Repository X → READ
Team B → Repository X → WRITE
```

If the user belongs to both teams:

```text
Effective permission = WRITE
```

Permission ordering:

```text
READ < WRITE
```

The effective permission is the highest permission granted by any active team relationship.

---

# 10. Removing One Team Must Not Remove Other Access

Example:

```text
Team A → Repository X → READ
Team B → Repository X → WRITE
```

User belongs to both.

Remove the user from Team B.

The user must still have:

```text
READ
```

through Team A.

The implementation must calculate effective access from current active relationships instead of blindly revoking repository access.

---

# 11. No UserRepositoryPermission Source of Truth

Do not introduce a separate:

```text
UserRepositoryPermission
```

table as the authoritative permission source.

The authorization source is:

```text
User
 ↓
TeamMembership
 ↓
TeamRepository
 ↓
Permission
```

This prevents conflicting permission sources.

---

# 12. Resource Authorization

Every resource identifier supplied by the client must be resolved and authorized.

Examples:

```text
teamId
repositoryId
userId
pullRequestId
syncJobId
```

The backend must verify:

```text
Does this resource belong to the user's organization?
```

and:

```text
Does this user have permission to perform this operation?
```

---

# 13. Never Trust Frontend Authorization

The following are not security mechanisms:

```text
hidden buttons
disabled buttons
frontend route guards
frontend role checks
frontend team filters
frontend repository filters
```

They improve UX only.

The backend must independently enforce authorization.

---

# 14. Resource Enumeration Protection

Internal identifiers should use non-guessable IDs such as UUIDs.

However, UUIDs alone are not authorization.

The backend must still perform authorization checks.

Where revealing resource existence could leak information, return a consistent not-found response rather than exposing that the resource exists but is unauthorized.

Avoid creating distinguishable responses that allow attackers to enumerate unauthorized resources.

---

# 15. Team Security

Team operations require organization-level management authority.

Only:

```text
OWNER
MANAGER
```

may:

* create teams
* update teams
* delete teams
* add members
* remove members
* assign repositories
* modify repository permissions

Members may only read teams they are authorized to see.

---

# 16. Team Membership Security

When adding a user to a team, the backend must verify:

```text
Authenticated caller
        ↓
OWNER / MANAGER
        ↓
Team belongs to organization
        ↓
Target user belongs to organization
```

Never allow a manager from Organization A to add a user from Organization B to a team.

---

# 17. Repository Security

Before modifying a repository relationship, verify:

```text
Team belongs to organization
        ↓
Repository belongs to organization
        ↓
Repository is eligible for operation
        ↓
Caller has OWNER / MANAGER authority
```

Do not trust a frontend-supplied combination of:

```text
teamId
repositoryId
organizationId
```

without resolving all three server-side.

---

# 18. Engineering Data Security

Every engineering-data endpoint must perform repository authorization.

Examples:

```text
GET /repositories/:repositoryId/pull-requests
GET /repositories/:repositoryId/commits
GET /repositories/:repositoryId/ci
GET /repositories/:repositoryId/activity
```

A user who cannot access the repository must not receive:

* PR data
* commit data
* CI data
* review data
* activity data

even if they know the URL or resource ID.

---

# 19. Pull Request Visibility

PR visibility is repository-based.

Example:

```text
Repository X
 ├── PR #101 by Team A
 ├── PR #102 by Team B
 └── PR #103 by Team C
```

If the user has access to Repository X, the user may see all authorized PR information in that repository.

The PR author's team does not create an additional visibility restriction.

---

# 20. Sync Job Security

Synchronization jobs are internal application resources.

Only:

```text
OWNER
MANAGER
```

may:

* inspect management-level synchronization state
* manually retry synchronization
* trigger reconciliation

Members must not be able to manipulate synchronization.

A member must never be able to submit:

```text
syncJobId
```

and cause arbitrary GitHub changes.

The worker must use persisted desired state.

---

# 21. Sync Worker Security

The worker must never blindly execute frontend payloads.

The safe flow is:

```text
Frontend Mutation
       ↓
Authorization
       ↓
Persist Desired State
       ↓
Create SyncJob
       ↓
Worker
       ↓
Load Current Desired State
       ↓
Apply to GitHub
```

The worker should not treat the original HTTP request body as authoritative.

---

# 22. Concurrency Security

Concurrent mutations must not produce an invalid authorization state.

Example:

```text
Request A:
READ

Request B:
WRITE
```

If B commits after A, GitHub must eventually converge to:

```text
WRITE
```

An older worker must never overwrite a newer desired state.

Database transactions and current-state synchronization are required to maintain this invariant.

---

# 23. Duplicate Requests

The backend must safely handle duplicate requests.

Examples:

```text
double-click
network retry
client timeout
repeated API request
```

For a true no-op:

```text
Team A → Repository X → READ
```

requesting:

```text
READ
```

again should not create unnecessary synchronization work.

For meaningful state changes, each mutation may create durable synchronization history.

The worker must still converge to current desired state.

---

# 24. GitHub App Security

The GitHub App private key is server-side infrastructure.

It must never be:

* returned through an API
* sent to the browser
* stored in frontend code
* logged
* committed to source control

Do not place production private keys inside:

```text
src/
```

or any publicly accessible directory.

Use environment/secret management appropriate to the deployment environment.

---

# 25. GitHub OAuth Security

User GitHub identity connection uses OAuth.

OAuth state must be:

```text
short-lived
single-use
server-side
bound to authenticated user
bound to organization context
```

The authorization code must be exchanged server-side.

Never send GitHub OAuth access tokens to the frontend.

---

# 26. GitHub Identity Ownership

A user's GitHub identity belongs to that user.

Managers must not be able to attach another person's GitHub identity to a Medit user.

Only the authenticated user can:

```text
connect their GitHub identity
disconnect their GitHub identity
```

Managers may view connection status where necessary for administration.

---

# 27. GitHub Identity Changes

If a user disconnects GitHub:

```text
Medit membership remains active
```

but Medit-managed GitHub team membership may need to be removed asynchronously.

When the user reconnects:

```text
current Medit state
        ↓
recompute desired GitHub state
        ↓
synchronize
```

Do not restore an old snapshot blindly.

---

# 28. GitHub Connection Failure

If the organization GitHub App becomes unavailable:

```text
GitHub Connection
        ↓
DISCONNECTED / SUSPENDED
```

Do not delete:

* teams
* repositories
* memberships
* desired permissions
* audit history

Existing desired state remains authoritative inside Medit.

Affected synchronization jobs become:

```text
WAITING
```

with an internal reason such as:

```text
GITHUB_CONNECTION_UNAVAILABLE
```

---

# 29. GitHub External Changes

GitHub is an external system and administrators may change things outside Medit.

Examples:

```text
GitHub team manually deleted
GitHub repository archived
GitHub team permission manually changed
GitHub member removed manually
GitHub installation suspended
```

External changes must not automatically become Medit's desired state.

The system should:

```text
detect
    ↓
verify
    ↓
compare with desired state
    ↓
reconcile
```

where appropriate.

---

# 30. Webhook Security

GitHub webhooks must verify their signatures before processing the payload.

Use the GitHub-provided webhook signature mechanism.

Reject invalid signatures.

Use the GitHub delivery ID to prevent duplicate processing.

Webhook handlers must tolerate:

* duplicate events
* delayed events
* out-of-order events
* missed events

Periodic reconciliation provides recovery from missed events.

---

# 31. Destructive Event Verification

Do not immediately change Medit lifecycle state because of an unverified destructive event.

Examples:

```text
repository deleted
team deleted
installation removed
```

For important destructive events:

```text
Webhook
  ↓
Validate
  ↓
Verify current GitHub state
  ↓
Update Medit state
```

Temporary GitHub API failure must not be interpreted as resource deletion.

---

# 32. GitHub Error Security

Raw GitHub errors must never be returned directly to clients.

Do not expose:

```text
GitHub request URL
GitHub access token
request headers
internal SDK error object
stack trace
GitHub internal error details
```

Instead return application-level errors:

```text
GITHUB_AUTH_FAILED
GITHUB_NOT_FOUND
GITHUB_RATE_LIMITED
GITHUB_UNAVAILABLE
GITHUB_API_ERROR
```

with safe messages.

---

# 33. Logging Security

Logs must never contain:

* access tokens
* OAuth tokens
* GitHub App private keys
* passwords
* cookies
* JWT secrets
* authorization headers
* sensitive request bodies

Use structured logging.

Include safe identifiers such as:

```text
requestId
organizationId
resourceId
syncJobId
```

where appropriate.

---

# 34. Audit Security

Audit logs must record security-sensitive management operations.

Examples:

```text
GitHub connection
GitHub disconnection
Team creation
Team deletion
Membership changes
Repository assignment
Permission changes
GitHub identity changes
Manual synchronization
Manual reconciliation
```

Audit records must identify:

```text
actor
organization
resource
action
timestamp
result
requestId
```

Never store credentials or secrets in audit logs.

---

# 35. Database Security

Use database constraints to reinforce application invariants.

Examples include:

```text
unique organization/team constraints
unique active membership constraints
unique active team/repository relationships
GitHub identity uniqueness
GitHub installation uniqueness
webhook delivery uniqueness
```

Application validation and database constraints should complement each other.

Do not rely exclusively on application checks for uniqueness under concurrency.

---

# 36. Transaction Security

Use transactions for operations where multiple state changes must succeed together.

Example:

```text
Create Team
+
Create SyncJob
```

must be atomic.

Likewise:

```text
Change TeamRepository permission
+
Create SyncJob
```

must be atomic.

This prevents the database from entering a state where the desired state exists without synchronization work.

---

# 37. Secrets in Source Control

No secret should be committed to Git.

Especially:

```text
GitHub App private key
OAuth client secret
API tokens
database passwords
JWT secrets
```

If a secret is accidentally committed:

```text
Remove from source
Rotate the secret
Invalidate the compromised credential
```

Removing the file alone is not sufficient if the credential was already exposed.

---

# 38. Security Testing Requirements

Security tests are mandatory.

At minimum test:

```text
cross-organization access
unauthorized repository access
unauthorized team access
member attempting management operation
manager accessing another organization
invalid resource identifiers
inactive resource access
deleted resource access
sync-job manipulation
GitHub webhook signature failure
duplicate webhook delivery
OAuth state reuse
OAuth state expiration
```

---

# 39. Critical Security Invariants

The implementation must preserve these invariants.

### Invariant 1

A user cannot access resources outside their organization.

### Invariant 2

A member cannot perform Owner/Manager operations.

### Invariant 3

A member cannot access an unauthorized repository.

### Invariant 4

Repository engineering data is protected by repository authorization.

### Invariant 5

Team membership alone does not grant repository access.

### Invariant 6

Effective repository permission is derived from active team relationships.

### Invariant 7

Removing one team relationship cannot remove access granted by another active team.

### Invariant 8

GitHub credentials never reach the frontend.

### Invariant 9

Workers operate on persisted desired state.

### Invariant 10

An external GitHub event cannot blindly overwrite Medit's desired authorization state.

### Invariant 11

Webhook deliveries are authenticated and deduplicated.

### Invariant 12

Security-sensitive mutations are auditable.

---

# 40. Security Review Checklist

Before considering GitHub Collaboration complete, verify:

```text
[ ] Every protected route requires authentication
[ ] Organization is derived server-side
[ ] Cross-organization access is blocked
[ ] Role checks are server-side
[ ] Repository authorization is server-side
[ ] Team authorization is server-side
[ ] Engineering data is repository-scoped
[ ] Members cannot mutate collaboration state
[ ] GitHub credentials never reach frontend
[ ] OAuth state is protected
[ ] Webhooks verify signatures
[ ] Duplicate webhooks are safe
[ ] Sync jobs cannot be manipulated by members
[ ] Workers use current desired state
[ ] Race conditions are tested
[ ] Database uniqueness constraints exist
[ ] Sensitive operations are audited
[ ] Secrets are excluded from logs
[ ] Secrets are excluded from source control
[ ] Security tests pass
```

---

# 41. Final Security Model

The security architecture is:

```text
                    Request
                       │
                       ▼
              ┌─────────────────┐
              │ Authentication  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Org Membership  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Role / Team     │
              │ Authorization   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Repository      │
              │ Authorization   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Business        │
              │ Operation       │
              └─────────────────┘
```

The central security principle is:

```text
The frontend controls presentation.
Medit's backend controls authorization.
Medit's database controls desired authorization state.
GitHub is an external system whose state is reconciled against that desired state.
```

Any implementation that violates these boundaries should be rejected during code review.
