# 05 — Backend Architecture

## 1. Purpose

This document defines the backend architecture for the Medit GitHub collaboration system.

The architecture extends the existing Express + TypeScript backend without replacing the current layered structure.

The existing application follows:

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

GitHub integration is added as an external integration boundary, and asynchronous synchronization is handled by a worker.

The primary architectural goal is:

> Keep HTTP request handling fast and predictable while making GitHub state reliably converge with the desired state stored in the database.

---

# 2. Existing Backend Architecture

The existing backend uses these primary layers:

```text
src/
├── controller/
├── middleware/
├── repositories/
├── routes/
├── services/
├── providers/
├── utility/
├── lib/
└── config/
```

The architecture should continue using these layers rather than introducing unnecessary abstractions.

The GitHub collaboration implementation should fit into this structure.

---

# 3. Request Flow

A normal synchronous request follows:

```text
HTTP Request
     ↓
Route
     ↓
Authentication Middleware
     ↓
Authorization Middleware
     ↓
Controller
     ↓
Service
     ↓
Repository
     ↓
Database
     ↓
Response
```

Responsibilities:

### Route

Routes map HTTP requests to controllers.

Routes must not contain business logic.

### Middleware

Middleware handles cross-cutting request concerns such as:

* authentication
* authorization checks
* rate limiting
* request context

Middleware must not contain complex GitHub business logic.

### Controller

Controllers are the HTTP boundary.

Controllers:

* receive validated input
* obtain authenticated user/context
* call services
* return API responses
* translate service results into HTTP responses when necessary

Controllers must not:

* contain business rules
* directly query Prisma
* directly call GitHub
* implement synchronization
* perform authorization based only on frontend-provided IDs

### Service

Services contain business logic and coordinate application operations.

Examples:

* determine whether a manager can modify a team
* determine whether a repository can be assigned to a team
* calculate the desired GitHub permission
* update application state
* create synchronization work
* coordinate transactions

Services may call repositories and the GitHub integration boundary.

Services should not contain low-level GitHub HTTP code.

### Repository

Repositories are responsible for persistence.

Repositories may:

* read database state
* create records
* update records
* query relationships
* execute database-specific operations

Repositories must not:

* call GitHub
* contain HTTP logic
* make authorization decisions
* contain controller behavior

---

# 4. GitHub Integration Boundary

GitHub communication must be isolated from business services.

Recommended structure:

```text
src/
└── providers/
    └── github/
        ├── github.provider.ts
        ├── github.client.ts
        ├── github.types.ts
        └── ...
```

The exact files may evolve as the integration grows.

The separation is:

```text
GitHub Service / Integration
        ↓
GitHub Provider
        ↓
GitHub Client
        ↓
GitHub API
```

### GitHub Integration

The integration layer understands application intent.

Examples:

```text
Synchronize team repository permission
Synchronize team membership
Synchronize repository access
Reconcile GitHub state
```

### GitHub Provider

The provider knows how to perform GitHub operations.

Examples:

```text
getRepository()
getTeam()
getTeamMembers()
addTeamMember()
removeTeamMember()
updateRepositoryPermission()
getPullRequests()
```

The provider must not decide why an application user should have access.

### GitHub Client

The client owns low-level GitHub API communication.

It handles:

* authentication
* request construction
* GitHub API calls
* response parsing
* GitHub-specific errors
* rate-limit information

Raw GitHub responses must not leak directly through application APIs.

---

# 5. GitHub App Credentials

GitHub App credentials are server-side secrets.

Private keys, installation credentials, access tokens, and similar credentials must never be:

* returned to the frontend
* stored in frontend code
* committed to source control
* logged
* included in API responses

Development and production secrets must be supplied through secure environment/secret management.

Do not store the GitHub App private key under:

```text
src/secrets/
```

If a private key has already been committed to repository history, it must be rotated.

---

# 6. Authorization Boundary

Authorization remains server-side.

The protected request flow is:

```text
Authentication
      ↓
Organization Membership
      ↓
Role / Team Membership
      ↓
Resource Authorization
      ↓
Business Operation
```

Frontend-provided identifiers such as:

```text
organizationId
teamId
repositoryId
memberId
pullRequestId
```

must never be trusted as proof of access.

The backend must verify relationships between the authenticated user and requested resources.

`ApiResponse<T>` is only a response-formatting mechanism.

It is not an authorization or security boundary.

---

# 7. GitHub Collaboration Model

The database stores application collaboration state.

Core relationships include:

```text
Organization
    ↓
Teams
    ↓
Team Members

Teams
    ↕
Repositories

Team ↔ Repository
    permission:
      READ
      WRITE
```

A user may belong to multiple teams.

Effective repository access is calculated from all applicable active team memberships.

The effective permission follows:

```text
READ < WRITE
```

Manager permissions are organization-level management permissions and do not require the manager to be a member of every team.

---

# 8. Desired State vs External State

The database is authoritative for the application's desired collaboration configuration.

GitHub is the external system that must converge toward that configuration.

Conceptually:

```text
Database
Desired State
     │
     ▼
Synchronization
     │
     ▼
GitHub
Actual State
```

Example:

```text
Database:
Team A → Repository X → WRITE

GitHub:
Team A → Repository X → READ
```

The system identifies the difference and attempts to make GitHub match the desired state.

The desired database state must not be rolled back merely because GitHub synchronization fails.

---

# 9. Asynchronous GitHub Mutations

GitHub mutations must not normally block the HTTP request until GitHub completes.

Example:

```text
HTTP Request
     ↓
Controller
     ↓
Service
     ↓
Database Transaction
     ├── Update Desired State
     └── Create Sync Job
     ↓
COMMIT
     ↓
202 Accepted
     ↓
Worker
     ↓
GitHub
```

The API response communicates that the requested application state has been accepted and synchronization is pending.

The API must not falsely report that GitHub has already been updated when the operation is still pending.

---

# 10. Sync Job

Synchronization work is represented by a durable database record.

A conceptual `SyncJob` contains:

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
```

The exact Prisma schema is defined separately during implementation.

The job represents synchronization work, not the desired state itself.

The desired state remains in the domain tables.

---

# 11. Sync Job Lifecycle

Initial states:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

Lifecycle:

```text
PENDING
   ↓
PROCESSING
   ↓
 ┌───────────────┐
 │               │
 ▼               ▼
COMPLETED     retryable failure
                 ↓
              PENDING
                 ↓
          maximum retries
                 ↓
              FAILED
```

`CANCELLED` is not required initially.

Stale work becomes irrelevant because the worker reconciles against the latest desired state.

---

# 12. Duplicate Work

The system should avoid unnecessary synchronization.

If the requested desired state is already the same as the current desired state, the service should not create unnecessary duplicate synchronization work.

Example:

```text
Existing:
Team A → Repo X → WRITE

New request:
Team A → Repo X → WRITE
```

No unnecessary GitHub synchronization should be created.

Database constraints must also protect against duplicate relationships under concurrent requests.

The application-level check alone is not sufficient.

---

# 13. Latest Desired State Wins

The worker must not blindly replay stale commands.

Example:

```text
10:01 → WRITE
10:02 → READ
```

If the `READ` transaction commits after `WRITE`, the current desired state is:

```text
READ
```

The worker should converge GitHub toward `READ`.

The rule is:

> The latest successfully committed desired state is authoritative.

This refers to database commit order, not merely HTTP arrival order.

---

# 14. Worker

Workers execute asynchronous synchronization jobs.

Recommended initial structure:

```text
src/
└── workers/
    └── github-sync.worker.ts
```

The worker:

1. Finds eligible jobs.
2. Atomically claims a job.
3. Loads trusted current database state.
4. Validates the job payload.
5. Determines the latest desired state.
6. Reads relevant GitHub state.
7. Detects drift.
8. Applies required changes.
9. Verifies important mutations.
10. Marks the job completed or schedules retry.

The worker must not trust arbitrary frontend data.

It operates from persisted application state.

---

# 15. Worker Concurrency

Worker concurrency must be configurable.

Example configuration:

```text
GITHUB_SYNC_WORKER_CONCURRENCY=10
```

The initial value may be approximately:

```text
10 concurrent jobs
```

The value should be adjustable without changing business logic.

Concurrency must be controlled because GitHub API rate limits, database capacity, and application resources are shared constraints.

---

# 16. Atomic Job Claiming

Multiple worker processes may exist.

The database must guarantee that the same job is not simultaneously claimed by multiple workers.

Unsafe:

```text
Worker A → reads PENDING
Worker B → reads PENDING
Worker A → processes
Worker B → processes
```

Required behavior:

```text
Worker A ──┐
           ├── atomic database claim
Worker B ──┘

Worker A → PROCESSING
Worker B → claim rejected
```

The job claim must be atomic.

This allows multiple workers to run safely.

---

# 17. Worker Lease

Workers can crash.

Example:

```text
Job = PROCESSING
Worker crashes
```

The job must not remain permanently stuck.

A processing lease is required.

Conceptual fields:

```text
lockedAt
workerId
```

If the processing lease expires:

```text
PROCESSING
     ↓
lease expired
     ↓
PENDING
```

The job becomes eligible for another worker.

The exact lease duration is an implementation configuration decision.

---

# 18. Retry Policy

GitHub synchronization uses bounded retries.

Initial policy:

```text
Maximum attempts = 4
```

Example:

```text
Attempt 1 → immediate
Attempt 2 → ~1 minute
Attempt 3 → ~2 minutes
Attempt 4 → ~4 minutes
```

Actual delays should include jitter.

The retry mechanism belongs to the infrastructure layer.

The GitHub integration determines whether a specific error is retryable.

Generally:

```text
Temporary network/API failure
        → retry

GitHub rate limit
        → retry according to reset information

Invalid request / authorization failure
        → normally do not blindly retry
```

After the maximum retry count:

```text
SyncJob = FAILED
```

The desired state remains unchanged.

---

# 19. Failed Synchronization

A failed synchronization does not mean that the desired application state is invalid.

Example:

```text
Desired state:
WRITE

GitHub:
READ

Sync:
FAILED
```

The database remains:

```text
WRITE
```

The system does not silently change it back to:

```text
READ
```

Recovery is handled through:

```text
Manual retry
+
Automatic reconciliation
```

---

# 20. Manual Retry

Managers may manually retry failed synchronization where the API contract permits it.

Manual retry should:

```text
FAILED
  ↓
PENDING
  ↓
Worker
```

Manual retry must not bypass:

* authorization
* validation
* organization isolation
* resource ownership rules

---

# 21. Reconciliation

Reconciliation protects the system from drift, missed events, failed jobs, and external changes.

Initial reconciliation interval:

```text
Every 10 minutes
```

The reconciler compares relevant application state against GitHub state.

Priority:

```text
1. Failed synchronization
2. Pending synchronization
3. Recently changed resources
4. Known drift
5. Bounded full reconciliation
```

Each category must use bounded batches.

A single reconciliation cycle must not attempt to process an unbounded number of resources.

---

# 22. GitHub Outages

A broad GitHub outage must not produce a failure storm.

If GitHub becomes broadly unavailable:

```text
Detect provider outage
        ↓
Back off synchronization
        ↓
Avoid unnecessary new attempts
        ↓
Reconciliation retries later
```

Individual temporary failures still use the normal retry mechanism.

This protects:

* database capacity
* worker capacity
* GitHub rate limits
* application stability

---

# 23. GitHub Drift

Manual GitHub changes can cause external drift.

Example:

```text
Database:
Team A → Repo X → WRITE

GitHub:
Team A → Repo X → READ
```

The system should:

```text
Detect drift
    ↓
Create audit record
    ↓
Apply desired state
    ↓
Verify result
```

For normal collaboration configuration, the product's desired state is authoritative.

However, destructive lifecycle changes require special handling.

For example, if a repository has been deleted externally, the system must not blindly recreate it without an explicit product rule.

---

# 24. Webhooks

GitHub webhooks are an additional source of external events.

Webhook processing must be:

* signature validated
* authenticated
* idempotent
* tolerant of duplicate events
* tolerant of out-of-order delivery
* isolated from direct business mutations where possible

Webhook events should update/reconcile application state rather than bypassing authorization rules.

A webhook must never grant a user application access simply because GitHub reported an event.

---

# 25. Transactions

Desired-state changes and creation of their synchronization work must occur in the same database transaction.

Example:

```text
BEGIN

Update desired collaboration state

Create SyncJob

COMMIT
```

Both must succeed together.

Invalid state:

```text
Desired state saved
SyncJob missing
```

If the transaction fails:

```text
Desired state not committed
SyncJob not committed
No GitHub synchronization
```

The GitHub API must not be called before the transaction commits.

---

# 26. Why GitHub Is Outside the Transaction

The database and GitHub are separate systems.

Do not attempt to create a database transaction that spans both.

Instead:

```text
Database Transaction
       ↓
Commit
       ↓
Asynchronous synchronization
       ↓
GitHub
```

This is an eventual-consistency boundary.

The system achieves reliability through:

* durable desired state
* durable sync jobs
* retries
* reconciliation
* verification
* auditing

---

# 27. Error Handling

GitHub-specific failures must be translated into application-level errors.

The backend must not expose raw GitHub errors.

Examples include:

```text
GITHUB_AUTH_FAILED
GITHUB_NOT_FOUND
GITHUB_RATE_LIMITED
GITHUB_UNAVAILABLE
GITHUB_API_ERROR
SYNC_FAILED
SYNC_CONFLICT
```

The existing `AppError` hierarchy and centralized error handler remain responsible for HTTP error formatting.

See:

```text
02-api-errors.md
```

---

# 28. Zod Validation

Zod is used at system boundaries.

HTTP requests must validate:

* path parameters
* query parameters
* request bodies

Worker job payloads must also be validated before execution.

Validation does not replace authorization.

Correct sequence:

```text
Validate input
     ↓
Authenticate
     ↓
Authorize
     ↓
Execute business operation
```

Resource ownership and team/repository access must always be checked server-side.

---

# 29. Audit Logging

Sensitive collaboration changes must be auditable.

Audit records should identify:

```text
actor
organization
resource
operation
timestamp
requestId
result
```

Examples:

```text
TEAM_CREATED
TEAM_MEMBER_ADDED
TEAM_MEMBER_REMOVED
TEAM_REPOSITORY_ASSIGNED
REPOSITORY_PERMISSION_CHANGED
GITHUB_DRIFT_DETECTED
SYNC_FAILED
SYNC_COMPLETED
```

Secrets and credentials must never appear in audit logs.

---

# 30. Request and Job Identity

Two identifiers have different meanings.

### requestId

Identifies the HTTP request.

Used for:

* tracing
* logs
* audit correlation
* debugging

### syncJobId

Identifies asynchronous synchronization work.

Used for:

* worker logs
* retry tracking
* synchronization status
* failure investigation

They must not be treated as interchangeable.

---

# 31. Observability

The GitHub synchronization system should expose enough information to answer:

```text
What happened?
Who initiated it?
Which organization was affected?
Which resource was affected?
Which sync job handled it?
How many attempts occurred?
Why did it fail?
When was it retried?
```

Logs should contain safe identifiers such as:

```text
requestId
syncJobId
organizationId
resourceId
workerId
attempt
```

Logs must never contain:

```text
GitHub tokens
private keys
JWT secrets
passwords
authorization headers
session secrets
```

---

# 32. Dependency Rules

The architecture follows these dependency rules:

```text
Controller
    ↓
Service
    ↓
Repository
```

For GitHub synchronization:

```text
Service
    ↓
GitHub Integration
    ↓
GitHub Provider
    ↓
GitHub Client
```

Workers coordinate asynchronous execution.

Repositories do not call GitHub.

GitHub providers do not contain application authorization rules.

Controllers do not contain business logic.

Utilities do not contain business logic.

---

# 33. Utility and Infrastructure Boundaries

The existing project contains both:

```text
utility/
lib/
```

They should remain conceptually different.

### utility/

Technical reusable helpers:

```text
validation
errors
response
JWT mechanics
IDs
retry
logging helpers
```

### lib/

Configured application infrastructure:

```text
Redis
audit logging infrastructure
rate limiting
tenant context
database configuration
```

Do not create generic files such as:

```text
utils.ts
helpers.ts
common.ts
misc.ts
```

These become dumping grounds for unrelated business logic.

---

# 34. Recommended GitHub Structure

The GitHub feature should fit the existing architecture:

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
│   ├── auth.middleware.ts
│   └── authorization.middleware.ts
│
└── utility/
```

The exact number of files should remain proportional to actual responsibilities.

Do not create empty abstraction layers simply to match the diagram.

---

# 35. End-to-End Example

Manager assigns Team A to Repository X with `WRITE`.

```text
HTTP
 ↓
Route
 ↓
Authentication
 ↓
Authorization
 ↓
Controller
 ↓
Team/Repository Service
 ↓
Validate manager permissions
 ↓
Database Transaction
 ├── Update desired state
 └── Create SyncJob
 ↓
COMMIT
 ↓
202 Sync Pending
```

Worker:

```text
SyncJob
 ↓
Atomic claim
 ↓
PROCESSING
 ↓
Load latest desired state
 ↓
Read GitHub state
 ↓
Compare
 ↓
Drift?
 ├── No → verify/complete
 │
 └── Yes
      ↓
   Audit drift
      ↓
   Apply desired state
      ↓
   Verify
      ↓
   COMPLETED
```

If GitHub fails:

```text
GitHub failure
 ↓
Retryable?
 ├── Yes → exponential backoff
 │          ↓
 │       retry
 │
 └── No → FAILED
```

After four failed attempts:

```text
FAILED
 ↓
Manual retry
      OR
Reconciliation
 ↓
PENDING
 ↓
Worker
```

---

# 36. Architectural Invariants

The following rules must always remain true:

1. Backend authorization is authoritative.
2. Users cannot cross organization boundaries.
3. Members cannot access unrelated teams or repositories.
4. Repository access is determined through authorized team membership.
5. Manager permissions are explicit and organization-scoped.
6. Frontend IDs never prove authorization.
7. GitHub credentials never reach the frontend.
8. GitHub secrets never appear in logs.
9. Desired state is stored in the database.
10. GitHub is treated as external state.
11. GitHub mutations are asynchronous where appropriate.
12. Desired state and SyncJob creation are atomic.
13. Duplicate desired state must not create unnecessary synchronization.
14. Only one worker can claim a job at a time.
15. Worker crashes cannot permanently lock jobs.
16. Latest successfully committed desired state wins.
17. Failed GitHub synchronization does not roll back desired state.
18. Failed jobs can recover through retry/reconciliation.
19. GitHub drift is auditable.
20. Raw GitHub errors never leak through application APIs.
21. Controllers remain thin.
22. Repositories remain persistence-focused.
23. GitHub communication remains isolated from business logic.
24. Workers operate on trusted persisted state.
25. Reconciliation is bounded and cannot create uncontrolled API load.

---

# 37. What This Architecture Does Not Decide

This document intentionally does not freeze:

* exact GitHub App permission matrix
* exact GitHub API endpoints
* Prisma schema details
* exact SyncJob table implementation
* exact worker scheduling technology
* exact webhook event list
* API endpoint request/response contracts
* GitHub rate-limit implementation details

Those belong in the subsequent design documents.

---

# 38. Implementation Order

Implementation should follow this order:

```text
1. Database collaboration models
        ↓
2. Repository layer
        ↓
3. Service business rules
        ↓
4. GitHub client/provider
        ↓
5. SyncJob persistence
        ↓
6. Worker + atomic claiming
        ↓
7. Retry/lease handling
        ↓
8. GitHub synchronization
        ↓
9. Webhooks
        ↓
10. Reconciliation
        ↓
11. API endpoints
        ↓
12. Tests
```

Do not implement the entire GitHub system in one large task.

Each boundary should be testable independently.

---

# 39. Core Architectural Rule

The backend follows this rule:

> **Controllers handle HTTP, services decide business behavior, repositories manage persistence, GitHub providers communicate with GitHub, and workers asynchronously converge GitHub toward the latest committed desired state.**
