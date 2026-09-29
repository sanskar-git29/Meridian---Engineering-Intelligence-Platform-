# 06 — GitHub API Contract

## 1. Purpose

This document defines the backend API contract for Medit's GitHub collaboration and engineering intelligence integration.

The API must support:

* GitHub organization connection through a GitHub App
* Repository discovery and lifecycle management
* Team management
* Team membership
* Team-to-repository permissions
* Individual GitHub identity connection
* Repository engineering data
* Asynchronous synchronization
* Webhooks
* Reconciliation
* Authorization and tenant isolation

The backend is authoritative for Medit's desired authorization state.

GitHub remains the external system whose state is synchronized with that desired state.

---

# 2. Core Architecture

The API follows the existing backend structure:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Database
```

GitHub operations follow:

```text
Service
  ↓
GitHub Integration
  ↓
GitHub Provider
  ↓
GitHub Client
  ↓
GitHub API
```

Asynchronous mutations follow:

```text
HTTP Request
  ↓
Authentication
  ↓
Authorization
  ↓
Validate request
  ↓
DB Transaction
  ├── Update desired state
  └── Create SyncJob
  ↓
Commit
  ↓
HTTP 202
  ↓
Worker
  ↓
GitHub
  ↓
Sync result
```

The API must never depend on the frontend directly controlling GitHub state.

---

# 3. API Namespace

All GitHub functionality is under:

```text
/api/github/
```

Routes:

```text
POST   /api/github/connection
GET    /api/github/connection
DELETE /api/github/connection

GET    /api/github/repositories
GET    /api/github/repositories/:repositoryId
POST   /api/github/repositories/:repositoryId/initialize
DELETE /api/github/repositories/:repositoryId

GET    /api/github/repositories/:repositoryId/pull-requests
GET    /api/github/repositories/:repositoryId/pull-requests/:pullRequestId

GET    /api/github/repositories/:repositoryId/commits

GET    /api/github/repositories/:repositoryId/ci
GET    /api/github/repositories/:repositoryId/ci/:runId

GET    /api/github/repositories/:repositoryId/activity

GET    /api/github/teams
POST   /api/github/teams
GET    /api/github/teams/:teamId
PATCH  /api/github/teams/:teamId
DELETE /api/github/teams/:teamId

GET    /api/github/teams/:teamId/members
POST   /api/github/teams/:teamId/members
DELETE /api/github/teams/:teamId/members/:userId

GET    /api/github/teams/:teamId/repositories
POST   /api/github/teams/:teamId/repositories
PATCH  /api/github/teams/:teamId/repositories/:repositoryId
DELETE /api/github/teams/:teamId/repositories/:repositoryId

POST   /api/github/users/me/connection
GET    /api/github/users/me/connection
DELETE /api/github/users/me/connection

GET    /api/github/sync/:syncJobId
POST   /api/github/sync/:syncJobId/retry

POST   /api/github/reconciliation

POST   /api/github/webhooks
```

---

# 4. Authentication

All protected GitHub endpoints require an authenticated Medit user.

Authentication flow:

```text
Request
  ↓
JWT authentication
  ↓
Authenticated Medit user
  ↓
Organization membership
  ↓
Role / team membership
  ↓
Resource authorization
```

`organizationId` must be derived from authenticated server-side context.

The client must never be trusted to select an organization by supplying:

```json
{
  "organizationId": "..."
}
```

as an authorization mechanism.

---

# 5. Authorization Model

## 5.1 Roles

Medit has:

```text
OWNER
MANAGER
MEMBER
```

### Owner

Organization-level administrative authority.

Can:

* connect/disconnect GitHub organization
* initialize/de-initialize repositories
* create/update/delete teams
* add/remove team members
* assign repositories to teams
* change team repository permissions
* inspect synchronization state
* retry failed synchronization
* trigger reconciliation
* access authorized engineering data

### Manager

Same GitHub management capabilities as Owner for v1.

Manager does not own the GitHub organization.

The GitHub App installation remains attached to the client's GitHub organization.

Replacing a manager must not:

* reinstall the GitHub App
* transfer GitHub ownership
* recreate teams
* recreate repositories
* change historical synchronization state

### Member

Members are read-only.

They can access:

* teams they belong to
* repositories authorized through those teams
* repository engineering data for authorized repositories
* relevant PRs
* commits
* CI/CD
* activity
* review activity

They cannot:

* create teams
* modify teams
* manage membership
* change repository permissions
* initialize repositories
* disconnect GitHub
* retry synchronization
* trigger reconciliation

---

# 6. Repository Authorization Boundary

Repository access is the primary engineering-data security boundary.

If a member has access to:

```text
repository-A
```

they can see the engineering data of that repository.

This includes:

* pull requests
* pull request authors
* reviewers
* commits
* CI/CD
* activity

The author's team does not determine visibility.

The repository authorization does.

A user without access to a repository must not be able to access its engineering data.

This rule applies to every endpoint, not only the repository list endpoint.

---

# 7. Team Authorization

A user may belong to multiple teams.

A team can have multiple repositories.

The relationship is:

```text
Organization
   │
   ├── Users
   │
   ├── Teams
   │      │
   │      └── Members
   │
   └── Repositories
          │
          └── TeamRepository
```

Team-to-repository permissions are:

```text
READ
WRITE
```

Effective permission is calculated from all active memberships.

Example:

```text
Team A → Repository X → READ
Team B → Repository X → WRITE

User belongs to Team A + Team B

Effective permission:
WRITE
```

If Team B membership is removed:

```text
Effective permission:
READ
```

Do not create a separate `UserRepositoryPermission` as the source of truth.

The source of truth is:

```text
User
  ↓
Active TeamMembership
  ↓
Active TeamRepository
  ↓
Permission
```

---

# 8. GitHub Organization Connection

## POST /api/github/connection

Connect the client's GitHub organization through the GitHub App.

Authorization:

```text
OWNER
MANAGER
```

The backend must verify that the authenticated user is authorized to perform the connection.

The GitHub organization must not be treated as owned by the manager.

### Behavior

The request establishes or reconciles the organization-level GitHub installation.

After successful connection:

```text
GitHubInstallation
  ↓
SyncJob
  ↓
Repository discovery
```

Repository discovery is asynchronous.

The endpoint must return:

```http
202 Accepted
```

when the connection request has been accepted for processing.

The response must provide enough information for the client to identify the connection and synchronization state.

---

# 9. GitHub Connection States

Organization connection states:

```text
ACTIVE
DISCONNECTED
SUSPENDED
ERROR
```

### ACTIVE

GitHub App installation is available and Medit can communicate with GitHub.

### DISCONNECTED

The GitHub App installation is no longer available.

### SUSPENDED

GitHub has suspended the installation or access is otherwise blocked by GitHub.

### ERROR

Medit encountered an unresolved integration problem.

Connection loss must not delete:

* teams
* repositories
* memberships
* desired permissions
* historical data
* audit records

Affected synchronization jobs become:

```text
WAITING
```

with an internal reason such as:

```text
GITHUB_CONNECTION_UNAVAILABLE
```

---

# 10. GET /api/github/connection

Returns the current GitHub connection state.

Example:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "GitHub connection retrieved",
  "data": {
    "status": "ACTIVE",
    "githubOrganization": {
      "name": "acme",
      "displayName": "Acme"
    },
    "sync": {
      "status": "COMPLETED",
      "lastSyncedAt": "2026-09-28T12:30:00Z"
    }
  }
}
```

Do not expose:

* GitHub App private keys
* installation access tokens
* OAuth access tokens
* internal secrets
* raw GitHub API responses

---

# 11. DELETE /api/github/connection

Disconnects the Medit GitHub integration.

Authorization:

```text
OWNER
MANAGER
```

The operation must be asynchronous.

It must not delete Medit historical state.

Expected behavior:

```text
Connection
  ↓
DISCONNECTED
```

Existing:

* teams
* repositories
* memberships
* desired permissions
* audit history

remain stored.

Future GitHub mutations are blocked until reconnection.

---

# 12. Repository Discovery

Repository discovery is separate from repository initialization.

Discovery means:

```text
GitHub repository exists and is visible to the installation.
```

Initialization means:

```text
Medit actively manages this repository's collaboration configuration.
```

A discovered repository does not automatically become an ACTIVE Medit-managed repository.

---

# 13. Repository Lifecycle

```text
DISCOVERED
    ↓
ACTIVE
    ↓
INACTIVE
    ↓
ACTIVE
```

`ACTIVE` means:

> Medit manages the repository.

It does not mean:

> The latest GitHub synchronization succeeded.

Synchronization state is represented separately.

---

# 14. GET /api/github/repositories

Returns repositories visible to the authenticated user.

Default behavior:

```text
status = ACTIVE
```

Optional status filtering can request:

```text
DISCOVERED
ACTIVE
INACTIVE
```

The endpoint must be paginated.

Example:

```http
GET /api/github/repositories?page=1&limit=20
```

Optional filters may include:

```text
status
search
```

Only repositories the user is authorized to see may be returned.

For members:

```text
authorized repositories only
```

For Owner/Manager:

```text
organization repositories
```

subject to the repository lifecycle/filter requested.

---

# 15. Repository Response

Repository responses use Medit's internal repository UUID.

GitHub's raw numeric repository ID must not be used as the frontend resource identifier.

Example:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Repositories retrieved",
  "data": {
    "items": [
      {
        "id": "repo_uuid",
        "name": "ecommerce-backend",
        "fullName": "acme/ecommerce-backend",
        "github": {
          "visibility": "PRIVATE",
          "defaultBranch": "main",
          "archived": false,
          "url": "https://github.com/acme/ecommerce-backend"
        },
        "management": {
          "status": "ACTIVE",
          "managedByMedit": true
        },
        "sync": {
          "status": "COMPLETED",
          "lastSyncedAt": "2026-09-28T12:30:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

# 16. GET /api/github/repositories/:repositoryId

Returns a repository detail view.

The response combines:

```text
GitHub metadata
+
Medit management state
+
Collaboration summary
+
Engineering summary
+
Synchronization state
```

Example:

```json
{
  "id": "repo_uuid",
  "name": "ecommerce-backend",
  "fullName": "acme/ecommerce-backend",
  "github": {
    "visibility": "PRIVATE",
    "defaultBranch": "main",
    "archived": false,
    "url": "https://github.com/acme/ecommerce-backend"
  },
  "management": {
    "status": "ACTIVE",
    "managedByMedit": true
  },
  "collaboration": {
    "teamCount": 3,
    "memberCount": 17
  },
  "pullRequests": {
    "open": 12,
    "merged": 184,
    "closed": 21,
    "recent": []
  },
  "commits": {
    "recentCount": 34,
    "lastCommitAt": "2026-09-28T11:30:00Z",
    "recent": []
  },
  "ci": {
    "status": "PASSING",
    "failedRuns": 2,
    "recent": []
  },
  "activity": {
    "recent": []
  },
  "sync": {
    "status": "COMPLETED",
    "lastSyncedAt": "2026-09-28T12:30:00Z"
  }
}
```

The embedded engineering collections must be bounded.

The detail response must not return unlimited:

* PRs
* commits
* CI runs
* activity

Recommended embedded limit:

```text
5–10 recent records
```

Dedicated endpoints provide complete paginated data.

---

# 17. Repository Initialization

## POST /api/github/repositories/:repositoryId/initialize

Authorization:

```text
OWNER
MANAGER
```

Initialization makes the repository actively managed by Medit.

The operation is asynchronous.

```text
DB desired state
  ↓
SyncJob
  ↓
GitHub reconciliation
```

Return:

```http
202 Accepted
```

Initialization must:

1. verify the repository belongs to the connected GitHub organization
2. verify current GitHub state
3. mark the repository ACTIVE
4. reconcile existing Medit-managed team/repository relationships
5. create synchronization work
6. preserve existing Medit configuration

If initialization is already in progress, the API must not create unnecessary duplicate work for the same current state.

---

# 18. Repository De-initialization

## DELETE /api/github/repositories/:repositoryId

Authorization:

```text
OWNER
MANAGER
```

De-initialization means:

```text
ACTIVE → INACTIVE
```

It does not:

* uninstall the GitHub App
* delete the GitHub repository
* delete Medit history
* revoke unrelated GitHub permissions

Only Medit-managed GitHub collaboration configuration may be removed.

If no active Medit-managed relationship exists, the backend must not assume that Medit owns the corresponding GitHub permission.

Cleanup is asynchronous.

---

# 19. Archived GitHub Repositories

GitHub's:

```text
archived
```

state is external metadata.

It does not automatically change:

```text
Medit ACTIVE / INACTIVE
```

An archived GitHub repository may remain:

```text
Medit ACTIVE
GitHub archived = true
```

Operation-specific restrictions may apply.

---

# 20. Deleted GitHub Repository

Repository deletion must be verified before changing Medit's lifecycle.

After confirmed deletion:

```text
Medit repository
    ↓
INACTIVE
```

History and audit records remain.

If another repository later appears with the same name, it is a new GitHub resource because repository identity is based on GitHub's immutable repository identity, not its name.

---

# 21. Pull Requests

## GET /api/github/repositories/:repositoryId/pull-requests

Read-only.

Authorization:

```text
User must have repository access
```

Pagination is required.

Supported filters should include:

```text
state
author
reviewer
baseBranch
updatedAfter
updatedBefore
```

Example:

```http
GET /api/github/repositories/:repositoryId/pull-requests
  ?page=1
  &limit=20
  &state=OPEN
```

The backend must validate that the requested repository is authorized before querying or returning PR data.

---

# 22. Pull Request Detail

## GET /api/github/repositories/:repositoryId/pull-requests/:pullRequestId

Read-only.

The response should contain bounded engineering information such as:

```text
PR identity
title
state
author
createdAt
updatedAt
mergedAt
source branch
target branch
review summary
reviewers
CI summary
activity summary
```

Large or unbounded information should be exposed through dedicated endpoints in future iterations rather than making the PR response arbitrarily large.

---

# 23. Commits

## GET /api/github/repositories/:repositoryId/commits

Read-only.

Pagination is required.

Supported filters may include:

```text
author
branch
path
since
until
```

Example:

```http
GET /api/github/repositories/:repositoryId/commits
  ?page=1
  &limit=30
  &branch=main
```

Authorization is repository-based.

---

# 24. CI/CD

## GET /api/github/repositories/:repositoryId/ci

Returns paginated workflow/CI information.

Possible filters:

```text
status
branch
workflow
event
since
until
```

Example:

```http
GET /api/github/repositories/:repositoryId/ci
  ?page=1
  &limit=20
  &status=FAILED
```

## GET /api/github/repositories/:repositoryId/ci/:runId

Returns detailed information about a specific CI run.

The run must belong to the requested repository.

---

# 25. Activity

## GET /api/github/repositories/:repositoryId/activity

Returns repository-scoped engineering activity.

Activity may include:

```text
commits
pull requests
reviews
CI runs
repository changes
```

The response must remain repository-scoped and authorized.

---

# 26. Engineering Data Rules

Engineering endpoints are:

```text
READ ONLY
```

in v1.

Medit does not modify:

* PRs
* commits
* CI workflows
* CI runs
* reviews
* GitHub engineering activity

through these endpoints.

GitHub remains the source of truth for engineering activity.

Medit provides authorized visibility and normalized application-level responses.

---

# 27. Teams

## GET /api/github/teams

Default:

```text
status = ACTIVE
```

Optional:

```text
status=DELETED
```

Pagination is required.

Possible filters:

```text
status
search
```

Members receive only teams they belong to.

Owners/Managers can see organization teams.

---

# 28. POST /api/github/teams

Authorization:

```text
OWNER
MANAGER
```

Request:

```json
{
  "name": "Backend",
  "description": "Backend engineering team"
}
```

The backend derives:

```text
organizationId
createdBy
GitHub organization
```

from authenticated context.

The client does not control these authorization fields.

Team creation is DB-first:

```text
Transaction
  ├── Create Team
  └── Create SyncJob
       ↓
Commit
       ↓
202
       ↓
Worker
       ↓
Create GitHub team
```

If GitHub creation fails, the Medit team remains.

The synchronization system retries.

---

# 29. Team Detail

## GET /api/github/teams/:teamId

Returns:

```text
team metadata
membership summary
repository summary
synchronization status
```

For authorized users it may also include bounded:

```text
PR activity
commit activity
repository engineering summary
```

Large collections must use dedicated endpoints.

---

# 30. PATCH /api/github/teams/:teamId

Authorization:

```text
OWNER
MANAGER
```

Allowed fields:

```text
name
description
```

Changing the Medit team name must result in an asynchronous GitHub team rename.

The Medit team identity remains stable.

The GitHub team ID should remain stable where GitHub supports the rename operation.

---

# 31. DELETE /api/github/teams/:teamId

Team deletion is a lifecycle operation.

```text
ACTIVE → DELETED
```

Authorization effects disappear immediately after the DB transaction.

Active:

```text
TeamMembership
TeamRepository
```

relationships must no longer grant authorization.

Historical records remain.

GitHub cleanup is asynchronous:

```text
remove team memberships
remove Medit-managed repository relationships
delete/archive GitHub team
```

Partial GitHub failures must not roll back the Medit lifecycle transition.

---

# 32. Team Membership

## GET /api/github/teams/:teamId/members

Authorization:

* Owner
* Manager
* members of the team

Members can view membership of teams they belong to.

The response must not expose unrelated teams.

---

# 33. POST /api/github/teams/:teamId/members

Authorization:

```text
OWNER
MANAGER
```

Request:

```json
{
  "userId": "user_uuid"
}
```

The backend verifies:

1. target team belongs to the authenticated organization
2. target user belongs to the same organization
3. caller has management authority
4. membership is not already active

The membership becomes active in Medit immediately.

GitHub synchronization is asynchronous.

Return:

```http
202 Accepted
```

---

# 34. DELETE /api/github/teams/:teamId/members/:userId

Authorization:

```text
OWNER
MANAGER
```

The active membership immediately stops granting Medit authorization.

GitHub removal is asynchronous.

The backend must recompute the user's effective repository access from remaining active teams.

Example:

```text
Team A → Repo X → READ
Team B → Repo X → WRITE

Remove Team B membership

Effective permission:
READ
```

The system must not blindly revoke repository access if another team still grants it.

---

# 35. Team ↔ Repository

## GET /api/github/teams/:teamId/repositories

Returns repositories assigned to the team.

Authorization:

* Owner
* Manager
* members of the team

Members only see authorized team/repository relationships.

---

# 36. POST /api/github/teams/:teamId/repositories

Authorization:

```text
OWNER
MANAGER
```

Request:

```json
{
  "repositoryId": "repository_uuid",
  "permission": "READ"
}
```

The backend validates:

```text
team belongs to organization
repository belongs to organization
repository is eligible
```

The relationship becomes active in Medit.

GitHub synchronization is asynchronous.

Return:

```http
202 Accepted
```

---

# 37. PATCH /api/github/teams/:teamId/repositories/:repositoryId

Authorization:

```text
OWNER
MANAGER
```

Request:

```json
{
  "permission": "WRITE"
}
```

Supported permissions:

```text
READ
WRITE
```

The team-level GitHub permission is changed asynchronously.

The worker updates the GitHub team-to-repository relationship.

Individual member jobs are not required because GitHub team membership provides the inherited access.

---

# 38. DELETE /api/github/teams/:teamId/repositories/:repositoryId

Authorization:

```text
OWNER
MANAGER
```

The relationship becomes inactive.

It immediately stops granting Medit authorization.

GitHub cleanup is asynchronous.

The backend must remove only GitHub access managed by Medit.

---

# 39. TeamRepository Lifecycle

TeamRepository relationships are retained rather than blindly hard-deleted.

Lifecycle:

```text
ACTIVE
  ↓
INACTIVE
  ↓
ACTIVE
```

Re-adding the same team to the repository restores the relationship.

The current permission becomes the desired permission.

Historical changes remain auditable.

---

# 40. User GitHub Identity

GitHub organization installation and user GitHub identity are different concepts.

```text
GitHub App Installation
    =
organization integration
```

while:

```text
GitHub OAuth Identity
    =
individual user's GitHub identity
```

---

# 41. POST /api/github/users/me/connection

Self-service only.

A user connects their own GitHub account through OAuth.

The OAuth flow must:

1. generate secure state
2. bind state to authenticated Medit user
3. bind state to organization context
4. use short expiration
5. enforce single use
6. exchange the authorization code server-side
7. retrieve GitHub user identity
8. persist immutable GitHub user ID

GitHub access tokens must never be returned to the frontend.

---

# 42. GET /api/github/users/me/connection

Returns the authenticated user's GitHub identity status.

Example:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "GitHub identity retrieved",
  "data": {
    "connected": true,
    "github": {
      "username": "developer",
      "avatarUrl": "..."
    }
  }
}
```

Only safe identity information should be returned.

---

# 43. DELETE /api/github/users/me/connection

A user may disconnect their own GitHub identity.

Existing Medit team memberships remain active.

GitHub synchronization removes the user from Medit-managed GitHub teams asynchronously.

The affected synchronization work may enter:

```text
WAITING
```

with reason:

```text
GITHUB_IDENTITY_MISSING
```

When the user reconnects, the system recomputes the current desired state.

It must not restore an old historical snapshot blindly.

---

# 44. Missing GitHub Identity

A user may be added to a Medit team before connecting GitHub.

This is valid.

Example:

```text
Medit membership:
ACTIVE

GitHub identity:
MISSING

Sync:
WAITING
```

The membership remains active.

When the user connects GitHub:

```text
WAITING
  ↓
PENDING
  ↓
GitHub synchronization
```

The worker computes the current desired state.

---

# 45. Synchronization

Every meaningful state-changing mutation creates durable synchronization work.

Examples:

```text
create team
rename team
delete team
add team member
remove team member
assign repository
change READ → WRITE
remove repository
initialize repository
de-initialize repository
```

A mutation that makes no actual state change does not need unnecessary synchronization work.

---

# 46. SyncJob

Conceptual model:

```text
id
organizationId
resourceType
resourceId
status
attempts
availableAt
lockedAt
workerId
lastError
createdAt
updatedAt
completedAt
```

Internal operational fields such as:

```text
attempts
lastError
workerId
```

are not exposed through normal client responses.

---

# 47. SyncJob States

```text
PENDING
PROCESSING
WAITING
COMPLETED
FAILED
```

### PENDING

Waiting for worker execution.

### PROCESSING

Currently being processed.

### WAITING

Blocked by an external dependency.

Examples:

```text
GITHUB_CONNECTION_UNAVAILABLE
GITHUB_IDENTITY_MISSING
```

WAITING does not consume normal retry attempts.

### COMPLETED

Desired state has been successfully reconciled.

### FAILED

Retries have been exhausted or the job requires explicit intervention.

---

# 48. Current-State Convergence

Sync jobs represent durable work history.

They are not blindly replayed commands.

Example:

```text
Job 1:
READ

Job 2:
WRITE
```

If the worker processes Job 1 after Job 2 has already committed, it reads the current desired state:

```text
WRITE
```

and applies WRITE.

Job 1 may therefore complete as a no-op or current-state reconciliation.

This prevents stale jobs from reverting newer desired state.

The database remains the source of desired authorization state.

---

# 49. Retry Policy

Retryable failures include:

```text
429
500
502
503
network timeout
temporary GitHub availability failures
```

Non-retryable failures include:

```text
401
403
404
422
invalid request
authorization failure
```

Retry uses bounded exponential backoff with jitter.

Initial maximum:

```text
4 attempts
```

After exhaustion:

```text
FAILED
```

The desired Medit state remains intact.

Manual retry and reconciliation can recover the resource later.

---

# 50. GET /api/github/sync/:syncJobId

Returns sanitized synchronization state.

Example:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Sync job retrieved",
  "data": {
    "id": "sync_uuid",
    "resourceType": "TEAM_REPOSITORY",
    "resourceId": "relationship_uuid",
    "status": "COMPLETED",
    "createdAt": "2026-09-28T12:00:00Z",
    "updatedAt": "2026-09-28T12:01:10Z",
    "completedAt": "2026-09-28T12:01:10Z"
  }
}
```

Do not expose:

```text
attempt count
worker ID
raw GitHub error
stack trace
GitHub token
internal infrastructure details
```

---

# 51. POST /api/github/sync/:syncJobId/retry

Authorization:

```text
OWNER
MANAGER
```

Manual retry uses the current desired database state.

It does not replay stale request payloads.

Return:

```http
202 Accepted
```

---

# 52. Reconciliation

## POST /api/github/reconciliation

Authorization:

```text
OWNER
MANAGER
```

The request starts asynchronous reconciliation.

It should not synchronously scan the entire organization.

The worker processes bounded batches.

Periodic reconciliation should run independently of the API.

Recommended initial interval:

```text
~10 minutes
```

---

# 53. Reconciliation Responsibilities

Reconciliation detects drift between:

```text
Medit desired state
```

and:

```text
GitHub actual state
```

Examples:

```text
GitHub team deleted manually
GitHub team permission changed manually
GitHub repository disappeared
GitHub installation changed
GitHub membership changed
```

The system should restore Medit's desired state where appropriate.

---

# 54. Webhooks

## POST /api/github/webhooks

One webhook endpoint handles GitHub webhook deliveries.

The endpoint must remain thin.

```text
Webhook
  ↓
Verify signature
  ↓
Validate delivery
  ↓
Identify event
  ↓
Dispatch
  ↓
Persist/process event
```

GitHub webhook signature verification is mandatory.

The GitHub delivery ID must be used for webhook idempotency.

---

# 55. Supported Webhook Categories

Collaboration/state events:

```text
installation
installation_repositories
organization
team
membership
repository
```

Engineering events:

```text
pull_request
pull_request_review
push
workflow_run
```

The exact supported GitHub event types should remain centralized in the GitHub integration layer.

---

# 56. Webhook Rules

Webhook payloads are signals.

They are not automatically treated as Medit's final source of truth.

For external state changes:

```text
Webhook
  ↓
Validate event
  ↓
Compare desired state
  ↓
Verify GitHub state when necessary
  ↓
Reconcile
```

The system must tolerate:

* duplicate deliveries
* out-of-order deliveries
* delayed deliveries
* missed deliveries

Periodic reconciliation provides eventual recovery.

---

# 57. GitHub Team Deleted Externally

If a managed GitHub team is manually deleted:

```text
Medit Team
    remains
```

The Medit team identity is not deleted.

Reconciliation recreates the GitHub representation.

The GitHub team ID may change.

The Medit team ID must remain stable.

---

# 58. GitHub Team Permission Changed Externally

If GitHub permission differs from Medit's desired permission:

```text
Medit desired state
      ↓
reconciliation
      ↓
restore desired GitHub permission
```

The external mutation does not automatically become Medit's desired state.

---

# 59. GitHub Installation Removed or Suspended

When the GitHub App installation is removed or suspended:

```text
Connection
  ↓
DISCONNECTED / SUSPENDED
```

GitHub mutations stop.

Existing Medit state remains.

Affected synchronization work becomes:

```text
WAITING
```

with an appropriate internal reason.

Repositories are not automatically marked INACTIVE merely because the GitHub connection is unavailable.

After reconnection:

```text
verify installation
  ↓
discover current repositories
  ↓
update GitHub metadata
  ↓
reconcile current Medit desired state
```

Historical snapshots are not blindly restored.

---

# 60. Error Contract

Successful responses use:

```ts
ApiResponse<T>
```

Conceptually:

```ts
export class ApiResponse<T> {
  public readonly success: true;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;

  constructor(
    statusCode: number,
    message: string,
    data: T
  ) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource.",
    "details": {},
    "requestId": "request_uuid"
  }
}
```

---

# 61. Stable Error Codes

GitHub collaboration APIs may use:

```text
VALIDATION_FAILED
AUTH_REQUIRED
AUTH_INVALID
FORBIDDEN
RESOURCE_NOT_FOUND

TEAM_NOT_FOUND
TEAM_MEMBER_NOT_FOUND
TEAM_ALREADY_EXISTS
MEMBER_ALREADY_IN_TEAM

REPOSITORY_NOT_FOUND
REPOSITORY_ACCESS_DENIED

GITHUB_AUTH_FAILED
GITHUB_NOT_FOUND
GITHUB_RATE_LIMITED
GITHUB_UNAVAILABLE
GITHUB_API_ERROR

SYNC_FAILED
SYNC_CONFLICT

INTERNAL_ERROR
```

Raw GitHub error messages must never be passed directly to clients.

---

# 62. Authorization vs Not Found

The backend must prevent resource enumeration.

Internal resource IDs use non-guessable identifiers such as UUIDs.

Authorization must still happen server-side.

For resources where exposing existence would leak information, the API may return a consistent not-found response rather than revealing that the resource exists but is unauthorized.

The exact behavior should be centralized rather than implemented differently in every controller.

---

# 63. Pagination

Collection endpoints use a consistent pagination structure.

Example:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Pagination must be bounded by a server-defined maximum.

The client cannot request unlimited results.

---

# 64. Filtering

Filtering belongs to the endpoint that owns the resource.

Examples:

```text
/repositories?status=ACTIVE

/teams?status=ACTIVE

/repositories/:id/pull-requests?state=OPEN

/repositories/:id/commits?author=user

/repositories/:id/ci?status=FAILED
```

Filters must be validated.

Unknown or invalid filters should produce:

```text
VALIDATION_FAILED
```

rather than silently changing behavior.

---

# 65. Internal vs External Identifiers

Frontend-visible:

```text
Medit UUID
```

Backend-only:

```text
GitHub numeric IDs
installation IDs
GitHub access tokens
GitHub App credentials
internal worker identifiers
```

GitHub IDs may be persisted for synchronization purposes but must not become the public API resource identity.

---

# 66. GitHub Response Mapping

Controllers and services must never expose raw GitHub SDK responses.

Instead:

```text
GitHub API response
  ↓
GitHub Provider
  ↓
Internal domain model
  ↓
Service
  ↓
API DTO
```

This protects the application from becoming coupled to GitHub's response structure.

---

# 67. Security Requirements

The backend must enforce:

```text
Authentication
    ↓
Organization membership
    ↓
Role/team authorization
    ↓
Resource authorization
```

Every protected endpoint performs appropriate authorization.

Frontend visibility is not security.

The following values must never be trusted merely because they came from the frontend:

```text
organizationId
teamId
repositoryId
memberId
pullRequestId
syncJobId
```

Every resource must be resolved and authorized server-side.

---

# 68. GitHub Secrets

Never expose to the frontend:

```text
GitHub App private key
GitHub access token
GitHub OAuth token
installation token
OAuth client secret
```

Never log these values.

The GitHub App private key must not live inside:

```text
src/
```

or be committed to source control.

If a private key has already been committed, it must be rotated.

---

# 69. Audit Requirements

The following operations require audit records:

```text
GitHub connection
GitHub disconnection

Repository initialization
Repository de-initialization

Team creation
Team update
Team deletion

Team member addition
Team member removal

Team repository assignment
Team repository removal
Team repository permission change

User GitHub identity connection
User GitHub identity disconnection

Manual synchronization retry
Manual reconciliation
```

Audit records should identify:

```text
actor
organization
resource
action
timestamp
result
requestId
```

Sensitive credentials must never be stored in audit records.

---

# 70. Concurrency and Idempotency

The backend must handle:

* duplicate frontend clicks
* concurrent mutations
* duplicate webhook deliveries
* out-of-order webhook deliveries
* stale sync jobs
* repeated reconciliation
* retry after timeout

The system should prefer:

```text
desired-state convergence
```

over:

```text
command replay
```

Example:

```text
Current desired permission:
WRITE

Old job:
READ

New job:
WRITE
```

Processing the old job must not downgrade the repository back to READ.

---

# 71. Transaction Boundary

A state-changing API must update Medit's desired state and create synchronization work atomically.

Example:

```text
BEGIN TRANSACTION

UPDATE TeamRepository
permission = WRITE

INSERT SyncJob

COMMIT
```

Never allow:

```text
desired state updated
```

without corresponding synchronization work when synchronization is required.

Likewise, do not create synchronization work for a state mutation that was rolled back.

---

# 72. Member Read Model

A member's experience should feel like a real engineering organization while remaining authorization-safe.

A member may see:

```text
My Teams
    ↓
Authorized Repositories
    ↓
Pull Requests
Commits
CI/CD
Reviews
Recent Activity
```

For an authorized repository, the member can see engineering activity involving other users as well.

Visibility is determined by repository authorization, not by the team of the person who created the activity.

---

# 73. Manager/Owner Read Model

Managers and Owners can see broader organization-level information, including:

```text
Teams
Repositories
Membership
Repository permissions
Synchronization status
Engineering activity
GitHub connection state
```

Management actions remain restricted to Owner/Manager.

---

# 74. Resource Lifecycle vs Sync State

These concepts must never be mixed.

Example:

```text
Repository lifecycle:
ACTIVE

Sync state:
FAILED
```

This means:

> The repository is still managed by Medit, but its latest GitHub synchronization failed.

Likewise:

```text
Repository lifecycle:
ACTIVE

GitHub connection:
DISCONNECTED
```

This means:

> Medit still wants to manage the repository, but GitHub is temporarily unavailable.

The desired state must survive these conditions.

---

# 75. Source of Truth

For Medit authorization:

```text
Medit Database
```

For GitHub actual state:

```text
GitHub
```

For synchronization:

```text
SyncJob + Worker + Reconciliation
```

For engineering activity:

```text
GitHub
```

Medit should normalize and expose authorized engineering information but should not redefine GitHub's engineering history.

---

# 76. Explicit Non-Goals for V1

The API does not implement:

```text
AI code review agent
AI PR reviewer
automatic code modification
automatic PR merging
individual repository permissions outside team-derived access
folder-level authorization
frontend-enforced security
GitHub token exposure
direct GitHub API calls from controllers
```

These may be considered later without changing the core authorization model.

---

# 77. Recommended Backend Structure

The API should fit the existing backend instead of replacing it.

```text
src/
├── controller/
│   └── github/
│
├── services/
│   ├── github/
│   └── sync/
│
├── repositories/
│   ├── github/
│   └── sync/
│
├── providers/
│   └── github/
│
├── workers/
│   └── github-sync.worker.ts
│
├── routes/
│   └── github.router.ts
│
├── middleware/
│
├── lib/
│
├── utility/
│
└── test/
    └── github/
```

Existing Controller → Service → Repository architecture remains the foundation.

---

# 78. End-to-End Example: Add Member to Team

```text
POST /api/github/teams/:teamId/members
        ↓
Authenticate
        ↓
Authorize Owner/Manager
        ↓
Validate team + user organization
        ↓
BEGIN TRANSACTION
        ↓
Create ACTIVE TeamMembership
        ↓
Create SyncJob
        ↓
COMMIT
        ↓
202 Accepted
        ↓
Worker
        ↓
Read current desired state
        ↓
Check GitHub identity
        ↓
Apply GitHub membership
        ↓
COMPLETED
```

If the user has no GitHub identity:

```text
WAITING
GITHUB_IDENTITY_MISSING
```

---

# 79. End-to-End Example: Change Team Permission

Initial state:

```text
Backend Team
    ↓
Repository X
    ↓
READ
```

Request:

```http
PATCH /api/github/teams/team-uuid/repositories/repo-uuid
```

Body:

```json
{
  "permission": "WRITE"
}
```

Backend:

```text
Authorize
  ↓
Update TeamRepository = WRITE
  ↓
Create SyncJob
  ↓
202
```

Worker:

```text
Read current TeamRepository
  ↓
Apply WRITE to GitHub
  ↓
COMPLETED
```

All team members inherit the new effective permission.

---

# 80. End-to-End Example: Multiple Teams

```text
User
 ├── Team A → Repository X → READ
 └── Team B → Repository X → WRITE
```

Effective access:

```text
WRITE
```

Remove Team B membership:

```text
User
 └── Team A → Repository X → READ
```

Effective access becomes:

```text
READ
```

The system must not revoke all GitHub access merely because one team membership disappeared.

---

# 81. End-to-End Example: GitHub Outage

```text
Medit desired state:
WRITE
```

GitHub becomes unavailable.

Result:

```text
TeamRepository:
WRITE

SyncJob:
WAITING

Connection:
DISCONNECTED / SUSPENDED
```

Medit authorization continues to use the desired state.

After reconnection:

```text
reconciliation
  ↓
current desired state = WRITE
  ↓
GitHub = WRITE
  ↓
COMPLETED
```

---

# 82. API Design Invariants

The following invariants must always hold.

### Invariant 1

A member cannot access a repository they are not authorized to access.

### Invariant 2

A member cannot modify GitHub collaboration configuration.

### Invariant 3

Manager identity does not determine GitHub organization ownership.

### Invariant 4

Team membership alone does not grant repository access.

A team must also have an active TeamRepository relationship.

### Invariant 5

Repository access is derived from active team memberships.

### Invariant 6

The highest active team permission determines effective permission.

```text
READ < WRITE
```

### Invariant 7

GitHub connection failure must not destroy Medit's desired state.

### Invariant 8

GitHub external changes must not silently redefine Medit's desired authorization state.

### Invariant 9

Sync jobs must converge toward current desired state.

### Invariant 10

Raw GitHub responses and credentials never cross the public API boundary.

### Invariant 11

Every protected endpoint performs server-side authorization.

### Invariant 12

Historical records required for auditing must not be destroyed by ordinary lifecycle operations.

---

# 83. Implementation Principle

The implementation should be built in dependency order:

```text
1. Domain models
2. Repository/data-access layer
3. GitHub provider/client abstraction
4. Authorization helpers
5. Services
6. SyncJob infrastructure
7. Worker
8. Controllers
9. Routes
10. Webhooks
11. Reconciliation
12. Tests
```

Do not begin by implementing every route independently.

The shared authorization, GitHub integration, synchronization, and lifecycle behavior must be established first.

---

# 84. Final Architecture

The resulting system should conceptually behave as:

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    GitHub Routes     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Authentication &   │
                    │    Authorization     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Services       │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └───────────┐
                 ▼                              ▼
        ┌──────────────────┐          ┌──────────────────┐
        │    PostgreSQL    │          │ GitHub Provider  │
        │                  │          │                  │
        │ Desired State    │          │ GitHub Client    │
        │ Teams            │          │                  │
        │ Memberships      │          └────────┬─────────┘
        │ Repositories     │                   │
        │ Permissions      │                   ▼
        │ Sync Jobs        │             GitHub API
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │   Sync Worker    │
        │                  │
        │ Retry            │
        │ Convergence      │
        │ Reconciliation   │
        └──────────────────┘
```

The core principle is:

```text
Medit defines desired authorization.
GitHub provides external state.
Workers make GitHub converge to Medit's desired state.
Reconciliation repairs drift.
Repository authorization controls engineering-data visibility.
```

This contract is the boundary between the product architecture and implementation.
