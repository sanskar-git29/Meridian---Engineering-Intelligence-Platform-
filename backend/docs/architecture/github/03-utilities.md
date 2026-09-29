# Backend Security Architecture

## 1. Purpose

This document defines the security principles for the backend.

Security must be enforced by the backend itself.

The frontend is a user interface, not a security boundary.

The primary security goals are:

* prevent unauthorized resource access
* prevent privilege escalation
* protect credentials and secrets
* prevent resource enumeration
* protect GitHub integration credentials
* validate all external input
* prevent sensitive information leakage
* maintain secure asynchronous operations
* provide traceability for security-relevant actions

---

# 2. Security Boundary

The backend is the authoritative security boundary.

Every protected request must go through:

```text
Request
   ↓
Authentication
   ↓
Organization membership
   ↓
Role / team membership
   ↓
Resource authorization
   ↓
Business operation
```

The frontend must never be trusted to enforce authorization.

Hiding a button does not mean the operation is protected.

---

# 3. Authentication vs Authorization

These are separate responsibilities.

### Authentication

Answers:

> Who is making this request?

### Authorization

Answers:

> Is this authenticated user allowed to perform this operation on this resource?

Example:

```text
Rahul authenticated
        ↓
Is Rahul a member of this organization?
        ↓
Which teams does Rahul belong to?
        ↓
Which repositories are authorized through those teams?
        ↓
Can Rahul perform this specific operation?
```

Successful authentication does not imply access to all organization resources.

---

# 4. Server-Side Authorization

Every protected endpoint must perform server-side authorization.

The backend must never trust client-provided:

```text
teamId
repositoryId
memberId
organizationId
pullRequestId
```

without verifying that the authenticated user is allowed to access the referenced resource.

A malicious user can modify requests manually even if the frontend prevents them from selecting unauthorized resources.

---

# 5. Organization Isolation

All organization-scoped resources must be checked against the authenticated user's organization.

The backend must prevent cross-organization access.

Conceptually:

```text
Authenticated User
        ↓
Organization A
        ↓
Request for Organization B
        ↓
DENY
```

A valid resource ID from another organization must never be sufficient to access that resource.

---

# 6. Team-Based Access

Members receive repository access through their active team memberships.

Example:

```text
Rahul
 ├── Backend Team
 │      └── backend-repository
 │
 └── DevOps Team
        └── infrastructure-repository
```

Rahul's effective access is the combined access granted through his authorized teams.

A member must not automatically receive access to repositories belonging to other teams.

---

# 7. Repository Security Boundary

The repository is the primary security boundary.

Folder-level permissions are not the primary authorization mechanism.

If separate access is required between frontend and backend:

```text
Project
├── ecommerce-backend
└── ecommerce-frontend
```

rather than relying on folders inside one repository as independent security boundaries.

---

# 8. Effective Permission

A member may belong to multiple teams.

Example:

```text
Backend Team
    → repository → READ

DevOps Team
    → same repository → WRITE
```

The effective permission must be calculated according to the application's defined permission precedence.

For the initial model:

```text
READ < WRITE
```

Therefore:

```text
READ + WRITE = WRITE
```

Authorization must use the effective permission rather than checking only one team membership.

---

# 9. Manager Authorization

The manager has organization-level management authority.

The manager does not need to become a member of every team.

The manager may:

* create teams
* remove teams
* add team members
* remove team members
* assign repositories to teams
* configure team repository permissions
* view GitHub collaboration data

These permissions must be enforced by the backend.

---

# 10. Member Authorization

Members have restricted read access based on their team memberships and authorized repositories.

Members may view relevant:

* repositories
* pull requests
* commits
* branches
* CI/CD information
* contributors
* activity

They must not automatically see unrelated teams or repositories.

---

# 11. Resource Enumeration Protection

Protected resources should not be discoverable through predictable IDs or authorization responses.

Use:

```text
non-sequential identifiers
+
server-side authorization
+
consistent 404/403 policy
```

For resources the user should not know exist, return `404`.

Do not rely on random IDs alone.

---

# 12. Response Security

`ApiResponse<T>` is only a response format.

It does not make data safe.

Before creating a response:

```text
Database entity
      ↓
Authorization
      ↓
Response shaping / DTO
      ↓
ApiResponse<T>
```

Never serialize sensitive database entities directly unless their complete structure is explicitly safe for the caller.

Never return:

```text
password hashes
access tokens
refresh tokens
private keys
GitHub installation tokens
internal credentials
```

---

# 13. Input Validation

All externally supplied input must be validated.

Validate:

* request body
* query parameters
* route parameters
* pagination parameters
* IDs
* permission values
* enum values

Validation does not replace authorization.

Both are required.

---

# 14. GitHub Credential Security

GitHub App credentials and private keys must remain server-side.

They must never be sent to the frontend.

Never expose:

```text
GitHub private key
GitHub installation token
GitHub access token
GitHub authorization header
```

through API responses, logs, client storage, or frontend state.

---

# 15. GitHub Integration Isolation

GitHub communication must remain inside the GitHub integration boundary.

Business services should not contain raw GitHub API calls throughout the application.

Use:

```text
Business Service
       ↓
GitHub Integration
       ↓
GitHub Client
       ↓
GitHub
```

This centralizes:

* authentication
* error handling
* rate limits
* retries
* request logging
* provider-specific behavior

---

# 16. Secret Handling

Secrets must be stored using the application's secure secret-management mechanism.

Do not hardcode secrets in source code.

Never commit:

```text
private keys
tokens
passwords
API secrets
```

to the repository.

Secrets must also be excluded from logs.

---

# 17. Error Information Security

Errors returned to clients must contain only safe information.

Never return:

```text
stack traces
database connection strings
SQL errors containing internal details
GitHub raw responses
tokens
private keys
internal filesystem paths
internal service configuration
```

Internal diagnostic information belongs in secure server-side logs.

---

# 18. Request Tracing

Every request should have a server-generated `requestId`.

Security and operational logs should be traceable using:

```text
requestId
syncJobId
organizationId
userId
operation
```

Do not place sensitive credentials in tracing metadata.

---

# 19. Asynchronous Security

Background workers must enforce security through the trusted desired state recorded by the application.

A worker must not trust arbitrary client-supplied authorization data.

Example:

```text
Manager request
      ↓
Authorize
      ↓
Persist desired state
      ↓
Create sync job
      ↓
Worker
      ↓
Read trusted desired state
      ↓
GitHub
```

The worker should not receive authority from a frontend payload.

---

# 20. Synchronization Security

The application database represents the desired authorization state.

GitHub represents external state.

The synchronization worker must only synchronize state that has been authorized and persisted by the application.

Example:

```text
Unauthorized client request
        ↓
Authorization fails
        ↓
No desired state change
        ↓
No synchronization job
```

An unauthorized request must never create a background job that later modifies GitHub.

---

# 21. Race Conditions

Security-sensitive operations must account for concurrent requests.

Examples:

```text
Manager removes Rahul
Manager adds Rahul
```

or:

```text
Manager changes WRITE → READ
Manager changes READ → WRITE
```

The system must maintain consistent desired state and prevent stale operations from overwriting newer authorized decisions.

Database transactions, concurrency controls, and synchronization design should be used where required.

---

# 22. Idempotency and Duplicate Requests

Security-sensitive mutations must safely handle duplicate requests.

Frontend button disabling is not sufficient.

The backend must assume that requests can be repeated.

Examples:

```text
Add Rahul twice
Remove Rahul twice
Assign repository twice
```

Repeated requests must not create unintended privilege escalation or inconsistent state.

---

# 23. Least Privilege

The system should grant only the minimum access required.

This applies to:

* application users
* managers
* members
* GitHub App permissions
* database credentials
* background workers
* service accounts

A component should not receive permissions simply because they are convenient.

---

# 24. GitHub App Permissions

GitHub App permissions should follow least privilege.

Only permissions required for the application's supported operations should be requested.

The exact GitHub permission matrix belongs in the GitHub API/integration contract document.

---

# 25. Auditability

Security-sensitive changes should be traceable.

Examples:

```text
team created
member added
member removed
repository assigned
repository permission changed
GitHub integration changed
manager changed
```

Useful audit information includes:

```text
actor
organization
resource
operation
timestamp
requestId
result
```

Audit records must not contain secrets.

---

# 26. Failure Security

A failed external operation must not accidentally weaken authorization.

Example:

```text
Desired permission = WRITE
GitHub synchronization fails
```

The application must not respond by:

```text
removing authorization data
granting broader access
falling back to unrestricted access
```

The desired state remains controlled by the application until synchronization succeeds or an authorized user changes it.

---

# 27. Security Testing

Security testing should cover:

### Authentication

```text
missing authentication
invalid authentication
expired authentication
```

### Authorization

```text
member accessing another team
member accessing another repository
cross-organization access
manager-only operation by member
```

### Resource enumeration

```text
sequential ID attempts
unauthorized resource lookup
```

### Input

```text
invalid IDs
unexpected fields
invalid permissions
malformed requests
```

### Secrets

```text
secret leakage in responses
secret leakage in logs
secret leakage in errors
```

### Concurrency

```text
conflicting permission changes
duplicate mutations
stale synchronization
```

---

# 28. Security Invariants

The following must always remain true:

1. Authentication is required for protected resources.
2. Authorization is enforced server-side.
3. Organization boundaries cannot be bypassed.
4. Members cannot access unrelated team/repository data.
5. Manager permissions are explicitly enforced.
6. Repository access is determined by authorized team membership.
7. Non-guessable IDs do not replace authorization.
8. `ApiResponse<T>` is not a security boundary.
9. Response DTOs expose only authorized data.
10. GitHub credentials never reach the frontend.
11. Secrets never appear in logs.
12. Raw GitHub errors never reach clients.
13. Unauthorized requests cannot create synchronization jobs.
14. Background workers operate on trusted persisted desired state.
15. Duplicate requests cannot create unintended privilege changes.
16. Failed synchronization cannot silently broaden access.
17. Security-sensitive operations are auditable.

---

# 29. Design Principle

> **Never trust the client. Verify identity, verify authorization, minimize exposed data, and keep credentials inside the server boundary.**

Security should be enforced by architecture rather than relying on developers to remember individual security checks.
