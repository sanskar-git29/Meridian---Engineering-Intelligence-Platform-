# GitHub Collaboration Architecture

## 1. Purpose

This document defines the backend architecture for GitHub collaboration within the product.

The system connects a client's organization to its GitHub organization through a GitHub App and provides controlled collaboration around projects, repositories, teams, members, pull requests, commits, and CI/CD activity.

The architecture prioritizes:

* Organization-owned GitHub integration
* Clear team-based repository access
* Server-side authorization
* Replaceable managers
* Reliable synchronization with GitHub
* Minimal and readable backend abstractions
* Strong TypeScript typing and validation
* Secure handling of GitHub credentials and permissions

---

# 2. Core Ownership Model

The client's organization owns the GitHub integration.

The manager is an administrator of the integration, not its owner.

```text
Client Organization
│
├── Owner
├── Manager
├── Teams
├── Projects
└── GitHub Integration
      │
      └── GitHub App Installation
            │
            └── GitHub Organization
```

The GitHub App installation must not be tied to an individual manager.

If the manager changes:

```text
Manager A
    ↓
removed
    ↓
Manager B
```

the following remain unchanged:

* GitHub App installation
* GitHub organization
* Projects
* Repositories
* Teams
* Repository access configuration

Only the application-level manager relationship changes.

---

# 3. GitHub Integration Model

The system uses a **GitHub App installation** rather than relying on a manager's personal OAuth authorization as the primary integration mechanism.

The GitHub App provides the backend with the ability to interact with the connected GitHub organization.

The application controls its own authorization separately.

These are three different concerns:

```text
Authentication
    ↓
Who is the application user?

Application Authorization
    ↓
What may this user do in our product?

GitHub App Authorization
    ↓
What may our backend do in GitHub?
```

A GitHub App permission must never be treated as equivalent to an application's user permission.

---

# 4. Organization and Project Model

A client organization can contain multiple projects.

A project can contain multiple GitHub repositories.

```text
Organization
│
└── Project
    ├── Repository A
    ├── Repository B
    └── Repository C
```

A repository is the primary authorization boundary.

Folder-level permissions are not used as the primary security mechanism.

For example, if backend and frontend code require independent access control:

```text
Project
├── backend-repository
└── frontend-repository
```

rather than:

```text
Project
└── repository
    ├── backend/
    └── frontend/
```

This allows GitHub itself to enforce repository-level access.

---

# 5. Team Model

Teams are the primary mechanism for assigning repository access.

A user can belong to multiple teams.

```text
Backend Team
├── Rahul
├── Priya
└── Aman

DevOps Team
├── Rahul
└── Sara
```

A team can have access to multiple repositories.

A repository can be accessible by multiple teams.

Therefore the relationship is many-to-many:

```text
Team ←→ Repository
```

with an explicit permission attached to the relationship.

Conceptually:

```text
TeamRepositoryAccess

team
repository
permission
```

Example:

```text
Backend Team → backend-repository → WRITE
Security Team → backend-repository → READ
```

A team must never implicitly receive access to every repository in the organization unless that behavior is explicitly defined by the authorization model.

---

# 6. Repository Permissions

The initial repository permission model is intentionally small.

```text
READ
WRITE
```

Additional permissions should only be introduced when a real product requirement requires them.

Do not create unnecessary permission levels such as:

```text
FULL
SUPER_ADMIN
EDITOR
DEVELOPER
```

without a defined authorization meaning.

Permissions should be represented using a strongly typed enum rather than arbitrary strings.

Conceptually:

```ts
enum RepositoryPermission {
  READ = "READ",
  WRITE = "WRITE",
}
```

The actual implementation should follow the project's existing enum/type conventions.

---

# 7. Effective Member Access

A member's repository access is derived from their active team memberships.

If a member belongs to multiple teams, their effective access is the combination of permissions granted by those teams.

Example:

```text
Rahul
├── Backend Team
│     └── backend-repository → WRITE
│
└── DevOps Team
      └── infrastructure-repository → READ
```

Rahul therefore has:

```text
backend-repository       → WRITE
infrastructure-repository → READ
```

but no access to unrelated repositories.

When calculating effective permissions, permission precedence must be explicit.

For the initial permission model:

```text
READ < WRITE
```

Do not compare permission strings directly.

Use a typed permission hierarchy or explicit mapping.

---

# 8. Manager Authorization

The manager has organization-level authority to manage GitHub collaboration.

Manager capabilities include:

* Create teams
* Remove teams
* Add members to teams
* Remove members from teams
* Assign repositories to teams
* Configure team repository permissions
* View GitHub collaboration data available to the organization

Manager authorization is based on the manager's organization-level role.

Manager access should not be implemented by making the manager a member of every team.

---

# 9. Member Authorization

Members are read-only users within the GitHub collaboration area.

A member can see data belonging to the teams they are actively part of and the repositories those teams can access.

For example:

```text
Rahul
└── Backend Team
      ├── backend-repository
      ├── Backend PRs
      └── Backend activity
```

Rahul must not be able to access:

```text
Frontend Team
Frontend repositories
Frontend PRs
Frontend members
```

unless Rahul is also an active member of the relevant team.

If Rahul belongs to both Backend and DevOps, he can see the authorized data from both teams.

---

# 10. Server-Side Authorization

Authorization must always be enforced by the backend.

The frontend is responsible for presentation only.

Hiding a button or page does not constitute authorization.

Every protected API request must establish:

```text
Authenticated User
        ↓
Organization Membership
        ↓
Organization Role / Team Membership
        ↓
Requested Resource
        ↓
Resource Authorization
```

Example:

```http
GET /api/github/teams/frontend/pull-requests
```

If Rahul belongs only to Backend:

```text
Authenticated → YES
Organization → YES
Frontend team membership → NO
Result → 403 Forbidden
```

The backend must not trust:

* `teamId`
* `repositoryId`
* `memberId`
* `pullRequestId`

supplied by the client.

Each resource must be authorized against the authenticated user's actual relationships.

---

# 11. Authentication vs Authorization

Authentication and authorization must remain separate concerns.

Authentication answers:

> Who is making this request?

Authorization answers:

> Is this user allowed to perform this operation on this resource?

A request should conceptually flow as:

```text
Request
  ↓
Authentication
  ↓
Authenticated User
  ↓
Authorization
  ↓
Controller
  ↓
Service
```

Authorization logic should not be duplicated throughout controllers.

Where possible, common authorization rules should be implemented through reusable guards, policies, middleware, or authorization services consistent with the existing backend architecture.

---

# 12. Desired State and GitHub State

The application maintains the desired authorization state.

GitHub maintains the external state that actually enforces access.

Example:

```text
Application DB

Rahul
  ↓
Backend Team
  ↓
backend-repository
  ↓
WRITE
```

This means:

> Rahul should have WRITE access.

GitHub must then reflect that desired state.

The application must not assume that the GitHub state is always identical to the database.

---

# 13. Synchronization

Changes to organization collaboration should follow a synchronization flow.

Example:

```text
Manager removes Rahul
        ↓
Application authorization state updated
        ↓
Synchronization work created
        ↓
GitHub synchronization
        ↓
GitHub access updated
```

GitHub API calls should not be scattered throughout unrelated business services.

Business logic should determine the desired state.

A dedicated GitHub integration/synchronization layer should apply that state to GitHub.

Conceptually:

```text
Business Service
      ↓
Database / Desired State
      ↓
Sync Job
      ↓
GitHub Integration
      ↓
GitHub API
```

---

# 14. Synchronization Failure

GitHub operations can fail because of:

* Network failure
* GitHub availability problems
* Expired or invalid credentials
* Rate limits
* Permission changes
* Temporary API failures

A failed GitHub synchronization must not silently discard the desired state.

Example:

```text
Database:
Rahul → NO ACCESS

GitHub:
Rahul → WRITE
```

The system must know that synchronization is incomplete.

The synchronization operation should have a state such as:

```text
PENDING
PROCESSING
SUCCESS
FAILED
```

Failed operations should be retryable using controlled retry/backoff behavior.

---

# 15. Reconciliation

The database and GitHub can become inconsistent even when no application operation is currently running.

For example, an administrator may change something directly in GitHub.

Therefore the system must support reconciliation.

Conceptually:

```text
Desired State
     ↓
Compare
     ↓
GitHub Actual State
     ↓
Difference?
   ↙       ↘
 No         Yes
 ↓           ↓
Done      Reconcile
```

Example:

```text
Application:
Rahul → backend-repository → READ

GitHub:
Rahul → backend-repository → WRITE
```

The reconciliation process detects the mismatch and restores the expected state.

Reconciliation should be designed as a safety mechanism rather than assuming GitHub will always remain synchronized.

---

# 16. Direct GitHub Access

The system must account for access granted directly through GitHub rather than through the application's team model.

Example:

```text
Application:
Rahul → NO ACCESS

GitHub:
Rahul → WRITE
```

This is an authorization mismatch.

The system should detect unmanaged access during reconciliation and apply the defined synchronization policy.

The application must not claim that a user has no access while GitHub independently grants that user access.

---

# 17. Member Lifecycle

Team membership must be treated as an active relationship.

When a member is removed from a team:

```text
Member
   ↓
Team membership removed
   ↓
Effective repository access recalculated
   ↓
GitHub synchronization
```

If the member belongs to another team that still grants access to the repository, that access must remain.

Example:

```text
Rahul
├── Backend → backend-repository → WRITE
└── DevOps  → backend-repository → READ
```

Removing Rahul from Backend should not remove all repository access if DevOps still grants access.

---

# 18. Manager Lifecycle

Manager changes must not modify GitHub ownership.

The correct relationship is:

```text
Organization
    ↓
GitHub App Installation
```

not:

```text
Manager
    ↓
GitHub App Installation
```

The manager is an authorized administrator of the organization's integration.

Changing the manager changes application authorization, not ownership of GitHub resources.

---

# 19. GitHub Data Visibility

The GitHub dashboard is read-oriented for members and management-oriented for managers.

Managers can manage collaboration and inspect organization-level GitHub information.

Members see only information within their authorized team/repository scope.

The member experience may include:

* Their teams
* Authorized repositories
* Pull requests relevant to their teams
* Their own activity
* Relevant team activity
* Commits
* CI/CD information

Future concepts such as manager notes and warnings are intentionally outside this version of the architecture.

---

# 20. Pull Requests

Pull requests are part of the GitHub collaboration data model.

Managers should be able to inspect pull requests associated with the teams and repositories they manage.

Members should only see pull requests within their authorized team/repository scope.

The backend must enforce the same authorization rules for pull-request APIs as for all other protected GitHub resources.

A pull request ID supplied by the frontend is not sufficient authorization.

The backend must verify that the authenticated user is authorized to access the associated repository/team.

---

# 21. Member Activity

The system may expose GitHub activity for an authorized member, including information such as:

* Commits
* Pull requests
* CI/CD results
* Relevant repository activity

Activity visibility must follow the same authorization boundaries as the underlying repository/team.

The system should avoid exposing organization-wide member activity to users who do not have authorization to see it.

---

# 22. Backend Layering

GitHub-specific logic must remain isolated from general business logic.

A conceptual structure is:

```text
github/
├── controllers/
├── services/
├── integration/
├── schemas/
├── types/
├── errors/
└── jobs/
```

The exact directory structure should follow the existing backend conventions rather than introducing unnecessary structure.

The important boundary is:

```text
Application Business Logic
        ↓
GitHub Integration Layer
        ↓
GitHub API
```

Business services should not directly construct arbitrary GitHub HTTP requests.

---

# 23. GitHub Client

All communication with GitHub should go through a dedicated GitHub client/integration abstraction.

The client is responsible for concerns such as:

* GitHub authentication
* API requests
* GitHub-specific response handling
* GitHub rate-limit information
* GitHub API errors

Business services should work with application-level types and concepts wherever practical.

Do not leak raw GitHub API response objects throughout the application.

---

# 24. API Contracts

Application APIs should expose stable application contracts rather than forcing the frontend to depend directly on GitHub response structures.

The backend should transform GitHub-specific data into application-level response types where appropriate.

This prevents GitHub API changes from unnecessarily spreading throughout the application.

Use:

* Explicit TypeScript types
* Zod schemas for runtime validation where appropriate
* Inferred types from schemas where useful
* Explicit API response contracts

Avoid:

```ts
any
```

for GitHub data unless there is a documented and unavoidable reason.

---

# 25. Validation

External and user-controlled input must be validated before entering business logic.

Conceptually:

```text
Request
  ↓
Validation
  ↓
Authorization
  ↓
Business Logic
  ↓
GitHub Integration
```

Validation schemas should be small, explicit, and reusable when appropriate.

Do not create large schemas containing unrelated fields merely for convenience.

---

# 26. Error Handling

GitHub errors must not be exposed directly as uncontrolled application responses.

The backend should translate external GitHub failures into the application's standardized error model.

The application should distinguish between:

```text
Authentication failure
Authorization failure
Validation failure
Resource not found
Conflict
Rate limit
External service failure
Internal failure
```

The exact error structure must follow the backend-wide API error contract.

Secrets, access tokens, authorization headers, webhook secrets, and sensitive GitHub response data must never be logged.

---

# 27. Security Principles

The following are mandatory principles:

1. GitHub App credentials and private keys must remain server-side.
2. GitHub access tokens must never be returned to the frontend.
3. Authorization must be performed server-side.
4. Team and repository identifiers from the client must be authorized before use.
5. Direct unmanaged GitHub access must be detected/reconciled according to the defined policy.
6. GitHub App permissions should follow least privilege.
7. Secrets must not appear in logs.
8. External GitHub data must not be trusted without validation where validation is required.
9. Repository access must be enforced through GitHub's repository-level permissions rather than application-only folder rules.

---

# 28. Rate Limits

GitHub API usage must be treated as a limited external resource.

The integration layer should centralize GitHub API communication so that rate-limit behavior can be observed and controlled.

The system should avoid unnecessary repeated GitHub requests through appropriate:

* Caching
* Pagination
* Request reuse
* Background synchronization
* Controlled retries

Caching must not be introduced blindly. Data freshness requirements should determine whether a resource is cached.

---

# 29. Background Processing

Operations that do not need to block the user's request should be handled asynchronously where appropriate.

Examples include:

```text
Permission synchronization
Reconciliation
Large GitHub data synchronization
Historical activity processing
```

The API should not make a user wait for a large synchronization process when the operation can safely be processed in the background.

Background jobs must be observable and retryable.

---

# 30. Webhooks

GitHub webhooks should be used where GitHub events are relevant to keeping the application state current.

Conceptually:

```text
GitHub
   ↓
Webhook
   ↓
Webhook validation
   ↓
Event processing
   ↓
Application state
```

Webhook processing should be designed to tolerate duplicate delivery.

Webhook handlers should not blindly trust incoming event data.

The webhook signature must be validated before processing.

---

# 31. Idempotency and Duplicate Events

GitHub events and synchronization operations may be repeated.

Operations should therefore be designed to be safely repeatable where possible.

For example:

```text
Add Rahul to Backend Team
```

should not create duplicate membership records if the same operation is processed twice.

Likewise, receiving the same webhook twice should not produce duplicate application state.

---

# 32. Observability

GitHub integration failures must be diagnosable.

Useful structured events include:

```text
github.request
github.response
github.sync
github.sync_failed
github.reconciliation
github.webhook
github.rate_limit
```

Logs must contain enough context to diagnose failures without exposing secrets.

Useful identifiers include:

* Organization ID
* Project ID
* Repository ID
* Team ID
* Synchronization job ID

Sensitive credentials must never be included.

---

# 33. Coding Standards

Implementation should prioritize readability and maintainability over abstraction for its own sake.

### Prefer

```text
Small services
Explicit types
Clear names
Single responsibility
Typed errors
Validated inputs
Reusable utilities
Centralized external integrations
```

### Avoid

```text
Generic "do everything" services
Deep abstraction layers without a reason
Duplicated GitHub API code
any
Magic strings
Hidden authorization rules
Business logic inside controllers
GitHub-specific objects spread through the application
```

A future engineer should be able to understand a GitHub feature by following a straightforward path:

```text
Route
 ↓
Controller
 ↓
Authorization
 ↓
Service
 ↓
Repository / persistence
 ↓
GitHub integration
```

---

# 34. Separation of Responsibilities

### Controller

Responsible for:

* Receiving requests
* Request/response mapping
* Calling authorization mechanisms
* Calling the appropriate service

Controllers should not contain complex business logic.

### Service

Responsible for:

* Business rules
* Permission decisions
* State changes
* Coordinating persistence and GitHub synchronization

### Persistence Layer

Responsible for:

* Database operations
* Team membership
* Repository relationships
* Desired authorization state
* Synchronization state

### GitHub Integration

Responsible for:

* GitHub API communication
* GitHub-specific authentication
* GitHub response mapping
* GitHub-specific errors

### Background Worker

Responsible for:

* Synchronization
* Retries
* Reconciliation
* Other asynchronous GitHub work

---

# 35. Architectural Invariants

The following rules must remain true throughout implementation:

1. The organization owns the GitHub integration.
2. The manager does not own the GitHub integration.
3. A manager change must not require repository ownership transfer.
4. A project may contain multiple repositories.
5. Repository access is assigned through teams.
6. A team may access multiple repositories.
7. A repository may be accessed by multiple teams.
8. A member may belong to multiple teams.
9. Effective access is derived from active team memberships.
10. Repository-level access is the primary security boundary.
11. Members cannot access teams or repositories outside their authorization scope.
12. Authorization is enforced by the backend.
13. Frontend visibility is never treated as security.
14. The database represents the desired application authorization state.
15. GitHub represents the external enforced state.
16. Synchronization keeps GitHub aligned with the desired state.
17. Reconciliation detects and repairs drift.
18. GitHub credentials remain server-side.
19. GitHub integration logic remains isolated from application business logic.
20. New abstractions must have a clear reason to exist.

---

# 36. Out of Scope for This Version

The following are intentionally not part of the initial architecture:

* AI code review
* Manager warnings and notes
* Folder-level GitHub authorization
* Complex permission hierarchies beyond the initial READ/WRITE model
* Additional GitHub automation not required for collaboration
* Unrelated GitHub features

These can be designed separately when their requirements are clear.

---

# 37. Initial Request Flow

A typical authorized member request should conceptually follow:

```text
Member
  ↓
API Request
  ↓
Authentication
  ↓
Organization Membership
  ↓
Team Membership
  ↓
Repository Authorization
  ↓
Service
  ↓
Application State / GitHub Integration
  ↓
Typed Response
```

A manager operation follows:

```text
Manager
  ↓
API Request
  ↓
Authentication
  ↓
Organization Role Authorization
  ↓
Validation
  ↓
Manager Service
  ↓
Update Desired State
  ↓
GitHub Synchronization
  ↓
Typed Response
```

The GitHub synchronization does not change the ownership model.

---

# 38. Design Principle

The system should be built around one simple separation:

```text
Our application decides
WHAT SHOULD BE ALLOWED.

GitHub enforces
WHAT CAN ACTUALLY HAPPEN.

Synchronization keeps
THE TWO STATES CONSISTENT.
```

This separation allows the manager to change without transferring ownership, allows members to receive access through teams, and gives the backend a clear place to enforce authorization and handle GitHub failures.
