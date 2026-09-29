# 07 — GitHub Collaboration Implementation Task

## 1. Objective

Implement the GitHub Collaboration backend for Medit according to:

* `01-github-collaboration-architecture.md`
* `02-api-errors.md`
* `03-utilities.md`
* `04-security.md`
* `05-backend-architecture.md`
* `06-github-api-contract.md`

Do not redesign the architecture defined in those documents.

The implementation must integrate with the existing Express + TypeScript + Prisma backend.

The goal is production-quality code that is:

* secure
* maintainable
* testable
* strongly typed
* efficient
* easy to extend
* resistant to concurrency and synchronization problems

---

# 2. Existing Backend Architecture

The project already uses:

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

GitHub integration must use:

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

Do not replace the existing architecture with a new framework or architectural pattern.

Reuse existing project conventions wherever they are appropriate.

---

# 3. Primary Implementation Principles

## 3.1 Clean Code

Code must be:

* readable
* explicit
* small
* cohesive
* strongly typed
* easy to test

Prefer:

```ts
const repository = await repositoryRepository.findById(repositoryId);
```

over deeply nested or generic abstractions that hide the actual behavior.

Avoid:

* giant functions
* giant service classes
* deeply nested conditionals
* duplicated business logic
* unnecessary abstractions
* generic `BaseService` / `BaseRepository` layers without a real need
* `utils.ts`
* `helpers.ts`
* magic strings
* unexplained constants

---

# 4. TypeScript Rules

Use strict TypeScript.

Do not use:

```ts
any
```

unless there is a genuinely unavoidable external boundary and the value is immediately validated/narrowed.

Prefer explicit domain types.

Example:

```ts
type TeamPermission = "READ" | "WRITE";
```

Do not pass loosely typed objects between layers.

Use separate types where necessary for:

```text
Request
Domain
Persistence
GitHub Provider
API Response
```

Do not expose Prisma-generated types directly as public API contracts unless there is a deliberate reason to do so.

---

# 5. Validation

All external input must be validated.

Use the project's existing Zod conventions.

Validate:

* route parameters
* query parameters
* request bodies
* OAuth callback input
* webhook metadata
* pagination
* filters
* enum values

Do not rely on TypeScript types for runtime validation.

TypeScript does not protect runtime API input.

---

# 6. Controller Rules

Controllers must remain thin.

A controller should primarily:

```text
Read request
    ↓
Use validated input
    ↓
Call service
    ↓
Return response
```

Controllers must not contain:

* Prisma queries
* GitHub API calls
* complex authorization logic
* synchronization logic
* retry logic
* business rules

Example responsibility:

```text
Controller
    ↓
githubTeamService.createTeam(...)
```

not:

```text
Controller
    ↓
Prisma
    ↓
GitHub SDK
    ↓
Retry
    ↓
Permission calculation
```

---

# 7. Service Rules

Services contain business logic.

Services are responsible for:

* authorization decisions that require business context
* lifecycle transitions
* desired-state changes
* transaction orchestration
* synchronization decisions
* effective permission calculations
* calling repositories
* calling the GitHub integration layer when synchronous GitHub access is appropriate

Services must not directly construct raw GitHub HTTP requests.

---

# 8. Repository Rules

Repositories contain persistence logic.

Repositories should handle:

* queries
* inserts
* updates
* deletes/lifecycle transitions
* transaction-compatible database operations
* efficient authorization queries

Repositories must not contain:

* HTTP logic
* GitHub SDK calls
* Express request/response objects
* business-level authorization decisions

---

# 9. GitHub Provider Architecture

GitHub access must be centralized.

Recommended structure:

```text
src/providers/github/
├── github.client.ts
├── github.provider.ts
├── github.types.ts
└── ...
```

The exact file split may be adjusted if the existing project conventions require it.

The important invariant is:

```text
Application code
      ↓
GitHub Provider
      ↓
GitHub Client
      ↓
GitHub API
```

Do not scatter GitHub SDK calls throughout services.

---

# 10. GitHub Client

The GitHub client owns low-level communication concerns.

Responsibilities include:

* authentication
* request construction
* GitHub SDK/API interaction
* rate-limit information
* transport errors
* timeout handling
* raw GitHub error normalization

The client must not decide Medit business rules.

It should not know:

```text
which team should have access
which user is authorized
whether a repository should be ACTIVE
```

Those decisions belong above the provider layer.

---

# 11. GitHub Provider

The provider converts GitHub-specific operations into application-friendly operations.

Examples:

```text
createTeam()
updateTeam()
deleteTeam()
addTeamMember()
removeTeamMember()
setTeamRepositoryPermission()
getRepositories()
getPullRequests()
getCommits()
getWorkflowRuns()
```

The provider must not expose raw GitHub SDK objects to application services.

Map external responses into controlled application/provider types.

---

# 12. API Response

Use the existing response abstraction defined in:

```text
03-utilities.md
02-api-errors.md
```

Do not create another response wrapper.

Success responses must follow:

```ts
ApiResponse<T>
```

Errors must follow the established error contract.

Do not return inconsistent response structures from different GitHub controllers.

---

# 13. Error Handling

Use the established application error hierarchy.

Examples:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
GitHubError
SyncError
```

Use stable application error codes.

Never expose:

```text
raw GitHub error
stack trace
database error
GitHub token
GitHub App credentials
internal worker details
```

to the frontend.

---

# 14. Error Mapping

GitHub errors must be translated into application-level errors.

For example:

```text
GitHub 401
    ↓
GITHUB_AUTH_FAILED

GitHub 404
    ↓
GITHUB_NOT_FOUND

GitHub 429
    ↓
GITHUB_RATE_LIMITED

GitHub 5xx
    ↓
GITHUB_UNAVAILABLE
```

The exact mapping should be centralized rather than duplicated across services.

---

# 15. Authorization

Authorization is mandatory for every protected endpoint.

Use:

```text
Authentication
    ↓
Organization Membership
    ↓
Role / Team Membership
    ↓
Resource Authorization
```

Never trust frontend-provided:

```text
organizationId
teamId
repositoryId
memberId
pullRequestId
syncJobId
```

without server-side verification.

---

# 16. Repository Authorization

Repository access is the primary engineering-data boundary.

Before returning:

```text
PR
Commit
CI run
Activity
Review
Repository detail
```

the backend must verify that the user has access to the repository.

Do not rely on:

```text
frontend route
frontend state
hidden UI elements
GitHub URL
```

for authorization.

---

# 17. Effective Repository Permission

Do not create a separate user-to-repository permission table as the source of truth.

Calculate effective permission from:

```text
User
 ↓
Active TeamMembership
 ↓
Active TeamRepository
 ↓
Permission
```

Use:

```text
READ < WRITE
```

and select the highest active permission.

Example:

```text
Team A → READ
Team B → WRITE

User belongs to A + B

Effective = WRITE
```

If Team B is removed:

```text
Effective = READ
```

The implementation must not accidentally revoke access still granted by another team.

---

# 18. Database Transactions

State changes that require synchronization must update:

```text
Desired State
+
SyncJob
```

atomically.

Example:

```ts
await prisma.$transaction(async (tx) => {
  await updateDesiredState(tx);
  await createSyncJob(tx);
});
```

The exact implementation may use the project's existing transaction conventions.

Never allow:

```text
desired state changed
```

while:

```text
SyncJob creation failed
```

for a mutation that requires synchronization.

---

# 19. SyncJob Architecture

Implement the synchronization foundation before implementing complex GitHub mutations.

Conceptual model:

```text
SyncJob
├── id
├── organizationId
├── resourceType
├── resourceId
├── status
├── attempts
├── availableAt
├── lockedAt
├── workerId
├── lastError
├── createdAt
├── updatedAt
└── completedAt
```

Statuses:

```text
PENDING
PROCESSING
WAITING
COMPLETED
FAILED
```

---

# 20. Worker

Create a dedicated GitHub synchronization worker.

Recommended location:

```text
src/workers/github-sync.worker.ts
```

The worker must:

1. claim eligible jobs
2. prevent multiple workers from processing the same job
3. respect job availability time
4. load current desired state
5. perform required GitHub operation
6. mark completion
7. retry retryable failures
8. move blocked jobs to WAITING
9. mark permanently failed jobs as FAILED

---

# 21. Worker Concurrency

The worker must safely handle concurrent workers.

Do not implement:

```text
SELECT job
WAIT
UPDATE job
```

without protecting the claim.

Use a database-safe claim/lease strategy.

The implementation must prevent two workers from simultaneously believing they own the same job.

---

# 22. Current-State Convergence

This is one of the most important implementation rules.

A SyncJob represents work that must be reconciled.

It does not represent a stale command that must blindly be replayed.

Example:

```text
Job 1:
READ

Job 2:
WRITE
```

If Job 1 executes after Job 2 has been committed, the worker must read:

```text
current desired state = WRITE
```

and apply WRITE.

Never let an older job revert newer desired state.

---

# 23. Retry Strategy

Retry only failures classified as retryable.

Retryable:

```text
429
500
502
503
network timeout
temporary connection failures
```

Non-retryable:

```text
401
403
404
422
invalid request
authorization failures
```

Use bounded exponential backoff with jitter.

Initial maximum:

```text
4 attempts
```

After exhaustion:

```text
FAILED
```

Do not create an infinite retry loop.

---

# 24. WAITING State

Use WAITING for external dependencies that are currently unavailable.

Examples:

```text
GITHUB_CONNECTION_UNAVAILABLE
GITHUB_IDENTITY_MISSING
```

WAITING must not consume retry attempts.

When the dependency becomes available:

```text
WAITING
  ↓
PENDING
  ↓
Worker
```

The worker must recalculate the current desired state before applying it.

---

# 25. Reconciliation

Implement reconciliation as a separate mechanism from normal mutation processing.

Reconciliation should:

* inspect current GitHub state
* compare it with Medit's desired state
* identify drift
* restore desired state where appropriate
* recover from missed webhooks
* recover from failed synchronization

Do not make every API request perform a complete organization-wide reconciliation.

---

# 26. GitHub Connection

Implement:

```text
POST   /api/github/connection
GET    /api/github/connection
DELETE /api/github/connection
```

Connection must use the GitHub App installation.

The GitHub App private key remains server-side.

After connection:

```text
save installation
    ↓
create discovery SyncJob
    ↓
return 202
```

Repository discovery is asynchronous.

---

# 27. Repository Management

Implement:

```text
GET    /api/github/repositories
GET    /api/github/repositories/:repositoryId
POST   /api/github/repositories/:repositoryId/initialize
DELETE /api/github/repositories/:repositoryId
```

Remember:

```text
DISCOVERED ≠ ACTIVE
```

Initialization makes the repository Medit-managed.

De-initialization removes only Medit-managed collaboration configuration.

---

# 28. Team Management

Implement:

```text
GET    /api/github/teams
POST   /api/github/teams
GET    /api/github/teams/:teamId
PATCH  /api/github/teams/:teamId
DELETE /api/github/teams/:teamId
```

Team creation must be DB-first:

```text
Create Team
+
Create SyncJob
↓
Commit
↓
202
↓
Worker
↓
GitHub
```

Do not create the GitHub team first and then attempt to persist Medit's state.

---

# 29. Team Membership

Implement:

```text
GET    /api/github/teams/:teamId/members
POST   /api/github/teams/:teamId/members
DELETE /api/github/teams/:teamId/members/:userId
```

Membership becomes effective in Medit after the database transaction.

GitHub synchronization occurs asynchronously.

If the user has no GitHub identity:

```text
Membership = ACTIVE
Sync = WAITING
```

---

# 30. Team Repository Permissions

Implement:

```text
GET    /api/github/teams/:teamId/repositories
POST   /api/github/teams/:teamId/repositories
PATCH  /api/github/teams/:teamId/repositories/:repositoryId
DELETE /api/github/teams/:teamId/repositories/:repositoryId
```

Permissions:

```text
READ
WRITE
```

Changing a team permission does not require individual GitHub synchronization jobs for every member.

The GitHub team permission is synchronized once.

---

# 31. User GitHub OAuth

Implement:

```text
POST   /api/github/users/me/connection
GET    /api/github/users/me/connection
DELETE /api/github/users/me/connection
```

OAuth state must be:

* short-lived
* single-use
* server-side
* bound to authenticated user
* bound to organization context

Authorization code exchange occurs server-side.

Never send GitHub access tokens to the frontend.

---

# 32. Engineering APIs

Implement read-only APIs:

```text
GET /api/github/repositories/:repositoryId/pull-requests
GET /api/github/repositories/:repositoryId/pull-requests/:pullRequestId

GET /api/github/repositories/:repositoryId/commits

GET /api/github/repositories/:repositoryId/ci
GET /api/github/repositories/:repositoryId/ci/:runId

GET /api/github/repositories/:repositoryId/activity
```

Every endpoint must enforce repository authorization.

Support pagination.

Support validated filters.

Do not return unlimited collections.

---

# 33. Webhooks

Implement:

```text
POST /api/github/webhooks
```

The endpoint must:

1. verify GitHub signature
2. validate delivery ID
3. reject duplicate deliveries safely
4. identify event type
5. dispatch event handling
6. avoid embedding business logic in the route

Webhook handlers must tolerate:

* duplicate events
* out-of-order events
* delayed events
* missing events

---

# 34. Webhook Source-of-Truth Rule

A webhook is a signal.

Do not blindly trust it as the final state.

For important state changes:

```text
Webhook
  ↓
Validate
  ↓
Compare desired state
  ↓
Verify current GitHub state when necessary
  ↓
Reconcile
```

---

# 35. Database Efficiency

Avoid N+1 queries.

Example of bad behavior:

```text
Get 50 teams
  ↓
query members for each team
  ↓
query repositories for each team
```

Prefer:

* joins
* Prisma `include` where appropriate
* batched queries
* aggregation queries
* indexed lookup paths

But do not blindly load enormous nested relations.

Choose query shapes based on the endpoint's actual response requirements.

---

# 36. Database Indexing

Review indexes for:

```text
organizationId
teamId
repositoryId
userId
status
GitHub identifiers
TeamRepository composite relationship
TeamMembership composite relationship
SyncJob status + availableAt
Webhook delivery ID
```

Indexes must support the actual authorization and worker queries.

Do not add indexes without understanding the query they support.

---

# 37. Lifecycle Integrity

Do not physically delete entities whose history is required.

Examples:

```text
Team
TeamMembership
TeamRepository
Repository
```

Use lifecycle states where appropriate.

Authorization queries must explicitly consider active state.

For example:

```text
TeamMembership.status = ACTIVE
TeamRepository.status = ACTIVE
```

must both be true for team-derived access.

---

# 38. Audit Logging

Use the existing audit infrastructure.

Do not create a second audit system.

Record:

```text
GitHub connect
GitHub disconnect

Repository initialize
Repository de-initialize

Team create
Team update
Team delete

Member add
Member remove

Repository assignment
Permission change

GitHub identity connect
GitHub identity disconnect

Manual sync retry
Manual reconciliation
```

Never log secrets.

---

# 39. Utility Reuse

Use the utilities defined in:

```text
03-utilities.md
```

Do not recreate functionality that already exists.

Examples:

```text
API response
API errors
request IDs
logging
retry utilities
validation
cookie utilities
JWT utilities
```

If a new utility is genuinely required:

1. verify an existing utility cannot solve the problem
2. place it in the correct existing utility category
3. keep it generic
4. document why it exists

A utility must not contain GitHub business logic.

---

# 40. Testing Philosophy

Testing is part of implementation, not a final cleanup step.

Every feature must include tests.

The implementation is not considered complete if the happy path works but authorization, failure, concurrency, or synchronization behavior is untested.

---

# 41. Unit Tests

Test pure business logic independently.

Examples:

```text
effective permission calculation
lifecycle transitions
filter validation
error mapping
retry classification
sync-state transitions
```

Example:

```text
READ + WRITE = WRITE
READ + READ = READ
WRITE + WRITE = WRITE
READ + no access = READ
```

---

# 42. Repository Tests

Test database behavior.

Include:

```text
create
update
lifecycle transitions
organization isolation
active/inactive filtering
team membership queries
team repository queries
effective permission queries
SyncJob claiming
SyncJob status transitions
```

Verify database constraints where applicable.

---

# 43. Service Tests

Service tests should verify business behavior.

Examples:

```text
Owner can create team
Manager can create team
Member cannot create team

User cannot add member from another organization

Inactive team does not grant access

Inactive TeamRepository does not grant access

Removing Team B does not revoke Team A access

Duplicate active membership is rejected safely

Permission changes create synchronization work

No-op mutations do not create unnecessary synchronization work
```

---

# 44. Authorization Tests

Security tests are mandatory.

Test:

```text
cross-organization access
cross-team access
unauthorized repository access
member attempting management operation
manager accessing another organization
invalid resource IDs
deleted resource access
inactive relationship access
```

Examples:

```text
Organization A user → Organization B repository
                ↓
              DENIED
```

```text
Member of Team A → Team B
                ↓
              DENIED
```

```text
Member without Repository X access
                ↓
GET Repository X
                ↓
DENIED / NOT FOUND
```

---

# 45. Sync Worker Tests

Test:

```text
PENDING → PROCESSING → COMPLETED

PENDING → PROCESSING → retry

PENDING → PROCESSING → WAITING

PENDING → PROCESSING → FAILED
```

Also test:

```text
retryable GitHub error
non-retryable GitHub error
GitHub outage
missing GitHub identity
missing GitHub connection
duplicate processing attempt
worker lease expiration
```

---

# 46. Current-State Convergence Tests

This test is mandatory.

Scenario:

```text
Job 1 = READ
Job 2 = WRITE
```

Process Job 1 after Job 2 has committed.

Expected GitHub state:

```text
WRITE
```

not:

```text
READ
```

Another scenario:

```text
READ
WRITE
READ
```

Final desired state:

```text
READ
```

The worker must converge to the latest desired state.

---

# 47. GitHub Provider Tests

Mock GitHub at the provider/client boundary.

Test:

```text
successful API response
401
403
404
422
429
500
502
503
timeout
malformed response
```

Verify that provider errors are mapped into safe application-level errors.

Do not require live GitHub API access for normal unit/integration tests.

---

# 48. Webhook Tests

Test:

```text
valid signature
invalid signature
duplicate delivery
unknown event
out-of-order event
repository deletion
team deletion
permission drift
installation removal
installation suspension
```

The same webhook delivery must not be processed twice.

---

# 49. API Integration Tests

Test actual HTTP behavior.

For each endpoint verify:

```text
authentication
authorization
validation
response status
response shape
database state
sync job creation
```

Example:

```text
POST /api/github/teams
        ↓
HTTP 202
        ↓
Team exists
        ↓
SyncJob exists
```

---

# 50. End-to-End Test Flow

At least one complete integration flow should cover:

```text
Create organization
    ↓
Create users
    ↓
Connect GitHub organization
    ↓
Discover repository
    ↓
Initialize repository
    ↓
Create Team
    ↓
Connect user's GitHub identity
    ↓
Add user to Team
    ↓
Assign Team → Repository
    ↓
Set WRITE permission
    ↓
Run synchronization
    ↓
Verify effective access
    ↓
Verify engineering data authorization
```

Then test removal:

```text
Remove user from Team
    ↓
Verify access disappears
```

And multi-team behavior:

```text
Team A → READ
Team B → WRITE

Remove Team B membership

Expected:
READ
```

---

# 51. Test Isolation

Tests must not depend on execution order.

Each test should have controlled:

* database state
* authentication state
* organization
* users
* teams
* repositories
* GitHub mock state

Do not rely on manually existing development records.

---

# 52. Test Naming

Use descriptive test names.

Prefer:

```text
should deny member access to repository outside authorized teams
```

over:

```text
testRepo2
```

Tests should explain the business rule being protected.

---

# 53. Implementation Workflow

Implement in small vertical slices.

Recommended order:

```text
Phase 1
Database models + migrations
        ↓
Phase 2
GitHub client/provider
        ↓
Phase 3
Authorization helpers
        ↓
Phase 4
SyncJob infrastructure
        ↓
Phase 5
GitHub connection
        ↓
Phase 6
Repository management
        ↓
Phase 7
Team management
        ↓
Phase 8
Team membership
        ↓
Phase 9
Team repository permissions
        ↓
Phase 10
User GitHub identity
        ↓
Phase 11
Engineering data
        ↓
Phase 12
Webhooks
        ↓
Phase 13
Reconciliation
        ↓
Phase 14
Full integration testing
```

Do not implement all phases in one large change.

---

# 54. AI Coding Workflow

When using an AI coding assistant, provide only the current implementation task.

Do not ask:

```text
Build the complete GitHub collaboration system.
```

Instead ask:

```text
Implement Phase 1 according to 07-implementation-task.md.
```

After completion:

1. inspect the changes
2. run tests
3. review the diff
4. check architecture consistency
5. fix issues
6. commit
7. move to the next phase

The AI must not silently redesign previous architecture decisions.

---

# 55. Before Writing Code

Before implementing a phase, inspect:

```text
existing Prisma schema
existing authentication
existing middleware
existing error handling
existing response utilities
existing audit system
existing Redis setup
existing test conventions
existing environment configuration
```

Reuse existing infrastructure when appropriate.

Do not duplicate systems that already exist.

---

# 56. Definition of Done

A feature is complete only when:

```text
[ ] Implementation follows architecture documents
[ ] Types are explicit
[ ] Input is validated
[ ] Authorization is enforced
[ ] Database operations are efficient
[ ] Transactions are used where required
[ ] Errors use established error system
[ ] GitHub access goes through provider/client
[ ] No secrets are exposed
[ ] Sync behavior is implemented correctly
[ ] Relevant tests exist
[ ] Failure cases are tested
[ ] Authorization cases are tested
[ ] Concurrency/idempotency cases are tested
[ ] Existing tests still pass
[ ] New tests pass
[ ] No unnecessary abstractions were introduced
[ ] No unrelated files were modified
```

---

# 57. Code Review Checklist

Before accepting AI-generated code, review:

### Architecture

```text
Does the code belong in the correct layer?
```

### Security

```text
Can a user access another organization?
Can a member access an unauthorized repository?
Can frontend IDs bypass authorization?
```

### Database

```text
Are queries indexed?
Are transactions correct?
Is there an N+1 query?
```

### GitHub

```text
Are all GitHub calls centralized?
Are raw GitHub errors hidden?
Are rate limits handled?
```

### Synchronization

```text
Can an old job overwrite newer state?
Can two workers process the same job?
Are retries bounded?
```

### Testing

```text
What happens when GitHub fails?
What happens when the user has no GitHub identity?
What happens when a team is deleted?
What happens when two teams grant different permissions?
```

---

# 58. Non-Goals

Do not implement unrelated improvements while working on GitHub Collaboration.

Do not:

* rewrite authentication
* rewrite the entire database layer
* replace Express
* replace Prisma
* introduce a new queue system without justification
* redesign the frontend
* build the AI review agent
* implement unrelated cost features
* refactor unrelated modules

If existing code has a problem that directly blocks the implementation, fix the smallest necessary part and document the reason.

---

# 59. Final Engineering Principle

The implementation must optimize for:

```text
Correctness
    >
Security
    >
Maintainability
    >
Observability
    >
Performance
    >
Convenience
```

Do not sacrifice authorization correctness or state consistency for a shorter implementation.

Do not add abstraction merely to make the code look sophisticated.

The best implementation is the smallest system that correctly enforces the architecture and remains easy for another engineer to understand.

---

# 60. Final Implementation Model

The finished system should behave like:

```text
                     ┌─────────────────────┐
                     │      HTTP API        │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Auth + Authorization│
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │      Services       │
                     └──────┬───────┬──────┘
                            │         │
                            ▼         ▼
                     ┌──────────┐ ┌──────────┐
                     │   DB     │ │ GitHub   │
                     │ Desired  │ │ Provider │
                     │  State   │ └────┬─────┘
                     └────┬─────┘      │
                          │             ▼
                          │        GitHub API
                          │
                          ▼
                     ┌──────────┐
                     │ SyncJob  │
                     └────┬─────┘
                          │
                          ▼
                     ┌──────────┐
                     │ Worker   │
                     └────┬─────┘
                          │
                          ▼
                     GitHub State
```

The central rule is:

```text
Medit Database
    = desired authorization state

GitHub
    = external actual state

Sync Worker
    = convergence mechanism

Repository Authorization
    = engineering-data security boundary

Tests
    = proof that the invariants hold
```

Implementation should proceed incrementally, with every phase reviewed and tested before the next phase begins.
