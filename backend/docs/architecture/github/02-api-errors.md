# API Error Architecture

## 1. Purpose

This document defines the application's API response and error architecture.

The goal is to provide:

* predictable API responses
* stable machine-readable error codes
* consistent HTTP status mapping
* safe error messages
* centralized error handling
* safe GitHub error translation
* reliable asynchronous synchronization failures
* useful request and synchronization tracing

The frontend must never need to understand internal database errors, worker errors, or raw GitHub API responses.

---

# 2. Success Response

All successful API responses should follow a consistent structure.

```ts
export class ApiResponse<T> {
  public readonly success = true;
  public readonly data: T;
  public readonly message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    this.message = message;
  }
}
```

Example:

```json
{
  "success": true,
  "data": {
    "id": "team_123",
    "name": "Backend"
  },
  "message": "Team created successfully."
}
```

The HTTP status code remains part of the HTTP response and does not need to be duplicated inside the response body.

Example:

```text
HTTP 201 Created
```

```json
{
  "success": true,
  "data": {
    "id": "team_123"
  }
}
```

### Responsibility

`ApiResponse<T>` is responsible only for the success response shape.

It should not be responsible for:

* selecting HTTP status codes
* authorization
* error handling
* GitHub communication
* database operations

---

# 3. Error Response

All API errors should follow one predictable structure.

```ts
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: SafeErrorDetails;
    requestId: string;
  };
}
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "TEAM_NOT_FOUND",
    "message": "The requested team was not found.",
    "requestId": "req_123"
  }
}
```

The frontend should primarily depend on `error.code`, not the human-readable message.

---

# 4. Error Code Rules

Error codes must be:

* stable
* machine-readable
* specific enough for debugging
* independent of provider-specific wording
* safe to expose to the client

Use domain-specific codes where they provide useful information.

Examples:

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

Avoid using one generic error such as:

```text
GITHUB_ERROR
```

when a more useful error category can be provided.

---

# 5. Error Classes

The application should use a small number of typed application error classes.

Do not create one class for every error code.

The error code should identify the specific problem, while the error class represents the broader category.

Conceptually:

```text
AppError
├── ValidationError
├── AuthenticationError
├── AuthorizationError
├── NotFoundError
├── ConflictError
├── GitHubError
└── SyncError
```

For example:

```text
NotFoundError
    ├── TEAM_NOT_FOUND
    ├── MEMBER_NOT_FOUND
    └── REPOSITORY_NOT_FOUND

ConflictError
    ├── TEAM_ALREADY_EXISTS
    └── MEMBER_ALREADY_IN_TEAM

GitHubError
    ├── GITHUB_AUTH_FAILED
    ├── GITHUB_NOT_FOUND
    ├── GITHUB_RATE_LIMITED
    └── GITHUB_UNAVAILABLE
```

A base application error should contain at least:

```ts
class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
}
```

The actual implementation can add additional fields when required.

---

# 6. HTTP Status Mapping

HTTP status codes must be mapped consistently.

| Status | Meaning                                                          |
| ------ | ---------------------------------------------------------------- |
| `400`  | Invalid request or malformed input                               |
| `401`  | Authentication required or invalid                               |
| `403`  | Authenticated but not authorized                                 |
| `404`  | Resource does not exist or should not be discoverable            |
| `409`  | Request conflicts with current application state                 |
| `422`  | Valid request structure but domain validation fails, when useful |
| `429`  | Rate limit exceeded                                              |
| `500`  | Unexpected internal failure                                      |
| `502`  | External dependency returned an unexpected response              |
| `503`  | External dependency temporarily unavailable                      |

---

# 7. Validation Errors

Invalid input must be rejected before business logic or GitHub calls.

Example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid fields.",
    "details": {
      "fields": {
        "teamId": "teamId is required"
      }
    },
    "requestId": "req_123"
  }
}
```

Validation details must contain only safe, application-defined information.

Never return:

* stack traces
* database errors
* raw GitHub responses
* internal object dumps

---

# 8. Authentication Errors

Authentication failures should not expose unnecessary information.

Examples:

```text
AUTH_REQUIRED
AUTH_INVALID
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication is required.",
    "requestId": "req_123"
  }
}
```

Authentication determines who the caller is.

It does not determine what the caller is allowed to access.

---

# 9. Authorization Errors

Authorization determines whether the authenticated user can perform an operation or access a resource.

Example:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this operation.",
    "requestId": "req_123"
  }
}
```

Authorization must always be enforced server-side.

Frontend visibility controls are not security controls.

The backend must independently verify access to:

* organization
* project
* team
* repository
* member
* pull request
* other protected resources

---

# 10. 404 vs 403

Protected resources require a consistent resource-discovery policy.

If a caller should not know that a resource exists, return:

```text
404 Not Found
```

Example:

```text
Rahul belongs to Backend.

Rahul requests:
GET /repositories/frontend-repository
```

If Rahul has no access to that repository and should not discover its existence:

```text
404
REPOSITORY_NOT_FOUND
```

This prevents unauthorized resource enumeration.

Use `403 Forbidden` when the caller can legitimately know that the resource exists but is not allowed to perform the requested operation.

The same policy must be applied consistently across protected resources.

---

# 11. Conflict Errors

Use `409 Conflict` when the request conflicts with the current application state.

Examples:

```text
TEAM_ALREADY_EXISTS
MEMBER_ALREADY_IN_TEAM
REPOSITORY_ALREADY_ASSIGNED
INVALID_STATE_TRANSITION
```

Conflict errors represent a valid request that cannot be applied because of the current state.

---

# 12. Safe Error Details

Error details must never be an unrestricted dump of internal or external data.

Do not use:

```ts
details?: unknown;
```

as an unrestricted API contract.

Instead, details should contain explicitly defined safe structures.

Example:

```ts
interface ValidationErrorDetails {
  fields: Record<string, string>;
}
```

Another possible example:

```ts
interface RateLimitErrorDetails {
  retryAfterSeconds?: number;
}
```

Never expose:

* GitHub access tokens
* GitHub private keys
* authorization headers
* passwords
* session secrets
* stack traces
* database credentials
* internal service configuration
* raw GitHub responses

---

# 13. GitHub Error Translation

Raw GitHub API errors must never be returned directly to the frontend.

The GitHub integration layer is responsible for translating provider-specific failures into application-level errors.

Example:

```text
GitHub:
401 Bad Credentials

Application:
GITHUB_AUTH_FAILED
```

The frontend should not need to understand GitHub's internal response format.

This also allows GitHub implementation details to change without changing the application's API contract.

---

# 14. GitHub Error Categories

The initial GitHub error categories are:

```text
GITHUB_AUTH_FAILED
GITHUB_NOT_FOUND
GITHUB_RATE_LIMITED
GITHUB_UNAVAILABLE
GITHUB_API_ERROR
```

### GITHUB_AUTH_FAILED

The GitHub App or integration credentials could not authenticate successfully.

This is normally not retryable without a change in the underlying authentication state.

### GITHUB_NOT_FOUND

The requested GitHub resource does not exist or cannot be found.

This is normally not retryable.

### GITHUB_RATE_LIMITED

GitHub has temporarily limited requests.

This should be handled using the provider's rate-limit information and retry policy.

### GITHUB_UNAVAILABLE

GitHub or the network dependency is temporarily unavailable.

This is normally retryable.

### GITHUB_API_ERROR

An unexpected GitHub API failure that does not fit another known category.

Retryability depends on the underlying failure.

---

# 15. Retry Policy

Not every error should be retried.

Generally non-retryable:

```text
401
403
404
422
```

Generally retryable:

```text
429
500
502
503
network timeout
temporary network failure
```

The exact retry decision belongs inside the GitHub integration and synchronization layers.

Retries must use:

* bounded attempts
* exponential backoff
* jitter where appropriate
* provider rate-limit information when available

The system must never retry forever.

---

# 16. Asynchronous GitHub Operations

Operations that modify GitHub state should be designed as asynchronous operations.

Example:

```text
Manager adds Rahul to Backend team
        ↓
Validate
        ↓
Authorize
        ↓
Update desired application state
        ↓
Create synchronization record
        ↓
Commit transaction
        ↓
202 Accepted
        ↓
Worker processes synchronization
        ↓
GitHub
```

The API should not need to keep the HTTP request open while waiting for GitHub.

Example:

```text
HTTP 202 Accepted
```

The response may indicate that the requested change has been accepted for processing.

The exact synchronization-status API can be defined in the API contract document.

---

# 17. Database and GitHub Consistency

The application database and GitHub are separate systems.

A database transaction cannot atomically commit:

```text
Application DB
+
GitHub API
```

Therefore, the system must not depend on:

```text
DB update
↓
GitHub API call
```

inside one HTTP request.

Instead, the application should use a durable synchronization/outbox mechanism.

```text
Request
   ↓
Validation
   ↓
Authorization
   ↓
DB transaction
   ├── Update desired state
   └── Create sync/outbox record
   ↓
Commit
   ↓
Return 202
   ↓
Worker
   ↓
GitHub
```

If the server crashes after the database transaction commits but before GitHub is called, the durable synchronization record allows the worker to process the operation later.

The operation must not be lost.

---

# 18. Desired State vs Actual State

The application database represents the desired state.

GitHub represents external actual state.

Example:

```text
Desired state:
Rahul → Backend → WRITE

GitHub actual state:
Rahul → Backend → READ
```

This means synchronization has not completed successfully.

A GitHub failure must not automatically remove or modify the desired application state.

The desired state remains authoritative for what the application wants GitHub to become.

---

# 19. Synchronization Failure

If synchronization fails:

```text
Desired state remains
        ↓
Worker retries
        ↓
Retry limit reached
        ↓
SYNC_FAILED
```

Example:

```text
desired permission = WRITE
GitHub permission = READ
sync status = FAILED
```

The desired state remains:

```text
WRITE
```

A later reconciliation process can detect the difference and attempt synchronization again.

A synchronization failure therefore does not mean that the manager's requested state has been cancelled.

---

# 20. Worker Retry Exhaustion

Workers should use bounded retries.

Example:

```text
Attempt 1
   ↓
Failure
   ↓
Backoff
   ↓
Attempt 2
   ↓
Failure
   ↓
Backoff
   ↓
Attempt 3
   ↓
Failure
   ↓
SYNC_FAILED
```

After retry exhaustion:

* preserve the desired state
* record the synchronization failure
* record diagnostic information
* stop aggressively retrying the same operation
* allow reconciliation to retry later

The exact retry count and backoff configuration belong to the worker architecture.

---

# 21. Latest Desired State

Multiple changes can happen before the worker processes them.

Example:

```text
Add Rahul
Remove Rahul
Add Rahul
```

The worker should not blindly execute all stale operations.

Instead, it should read the current desired state and make GitHub converge toward it.

```text
Multiple requests
        ↓
Current desired state
        ↓
Worker reads desired state
        ↓
Compare with GitHub
        ↓
Apply required change
```

This reduces unnecessary GitHub API calls and prevents stale operations from overwriting newer decisions.

Worker concurrency must still be controlled so that multiple workers cannot incorrectly modify the same resource simultaneously.

---

# 22. Duplicate Requests and Idempotency

Frontend controls such as disabling a button are useful for user experience but are not sufficient for backend correctness.

Duplicate requests can still occur because of:

* multiple browser tabs
* network retries
* race conditions
* API clients
* manual requests

The backend must safely handle duplicate requests.

Example:

```text
Add Rahul → Backend → WRITE
Add Rahul → Backend → WRITE
```

The system should recognize that the desired state is already the same or already pending and avoid unnecessary duplicate synchronization work.

A formal idempotency-key mechanism can be introduced for operations where stronger request-level guarantees are required.

---

# 23. Request ID

Every API request should have a `requestId`.

The request ID allows the request to be traced through:

```text
HTTP request
      ↓
Controller
      ↓
Service
      ↓
Database
      ↓
External integration
      ↓
API response
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred.",
    "requestId": "req_123"
  }
}
```

The request ID should also be included in structured server logs.

---

# 24. Synchronization Job ID

Asynchronous operations require their own identifier.

Example:

```text
requestId: req_123
syncJobId: sync_456
```

They represent different things.

### requestId

Identifies the HTTP request.

### syncJobId

Identifies the background synchronization operation.

Logs should allow:

```text
requestId
    ↓
syncJobId
    ↓
GitHub operation
```

This is required for debugging failures that occur after the original HTTP request has completed.

---

# 25. Rate Limiting

Application rate limiting should return:

```text
429 Too Many Requests
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfterSeconds": 30
    },
    "requestId": "req_123"
  }
}
```

GitHub rate limits should be handled separately by the GitHub integration and synchronization layers.

---

# 26. Internal Errors

Unexpected internal failures should never expose implementation details.

Return:

```text
500 Internal Server Error
```

with:

```text
INTERNAL_ERROR
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred.",
    "requestId": "req_123"
  }
}
```

The actual exception and stack trace belong only in server-side logs.

---

# 27. Logging

Errors must be logged with enough context to diagnose failures.

Useful fields include:

```text
requestId
syncJobId
organizationId
userId
operation
errorCode
retryAttempt
externalService
timestamp
```

Sensitive credentials must never be logged.

Never log:

```text
GitHub private keys
access tokens
authorization headers
passwords
session secrets
```

---

# 28. Centralized Error Handling

Controllers and business services should not manually construct HTTP error responses throughout the codebase.

The application should have a centralized error handler.

Conceptually:

```text
Controller
   ↓
Service
   ↓
Throws typed AppError
   ↓
Central Error Handler
   ↓
HTTP Status Mapping
   ↓
ApiErrorResponse
```

This ensures every endpoint follows the same response contract.

---

# 29. Error Ownership

Each layer should own the errors it understands.

### Validation Layer

```text
VALIDATION_FAILED
```

### Authentication Layer

```text
AUTH_REQUIRED
AUTH_INVALID
```

### Authorization Layer

```text
FORBIDDEN
RESOURCE_NOT_FOUND
```

### Domain Services

```text
TEAM_NOT_FOUND
MEMBER_NOT_FOUND
REPOSITORY_NOT_FOUND
TEAM_ALREADY_EXISTS
MEMBER_ALREADY_IN_TEAM
```

### GitHub Integration

```text
GITHUB_AUTH_FAILED
GITHUB_NOT_FOUND
GITHUB_RATE_LIMITED
GITHUB_UNAVAILABLE
GITHUB_API_ERROR
```

### Synchronization Layer

```text
SYNC_FAILED
SYNC_CONFLICT
```

---

# 30. Error Flow

For a normal synchronous request:

```text
Request
   ↓
Validation
   ↓
Authentication
   ↓
Authorization
   ↓
Business Logic
   ↓
Database / Integration
   ↓
Typed AppError
   ↓
Central Error Handler
   ↓
HTTP Status + ApiErrorResponse
```

For an asynchronous GitHub mutation:

```text
Request
   ↓
Validation
   ↓
Authentication
   ↓
Authorization
   ↓
DB Transaction
   ├── Desired State
   └── Sync/Outbox Record
   ↓
202 Accepted
   ↓
Worker
   ↓
GitHub
   ↓
Success / Retry / Failure
   ↓
Reconciliation
```

---

# 31. API Endpoint Responsibility

This document defines the common response and error architecture.

It does not define individual endpoint contracts.

Endpoint-specific documentation belongs in the API contract document.

For example, an endpoint contract may later define:

```text
POST /teams
```

Possible responses:

```text
201
TEAM_ALREADY_EXISTS → 409
VALIDATION_FAILED → 400
FORBIDDEN → 403
INTERNAL_ERROR → 500
```

The endpoint document defines **which errors are possible for that endpoint**.

This document defines **what those errors mean and how they are represented**.

---

# 32. Architectural Guarantees

The API architecture guarantees:

1. Successful responses have a predictable structure.
2. Error responses have a predictable structure.
3. Error codes are stable and machine-readable.
4. HTTP status codes are mapped consistently.
5. Raw GitHub errors are never exposed directly.
6. Sensitive information is never returned to clients.
7. Authentication and authorization remain separate concerns.
8. Protected resources follow a consistent `404`/`403` policy.
9. Temporary external failures can be retried safely.
10. Retries are bounded.
11. Database state is not lost because of a server crash before GitHub synchronization.
12. Failed synchronization does not erase desired application state.
13. Duplicate requests do not create unnecessary synchronization work.
14. Workers converge GitHub toward the latest desired state.
15. HTTP requests and asynchronous jobs can be independently traced.
16. Background failures remain diagnosable without exposing internal details.

---

# 33. Non-Goals

This document does not define:

* exact database schema
* exact worker implementation
* queue technology
* exact GitHub API endpoints
* GitHub App permission configuration
* webhook implementation
* reconciliation scheduling
* frontend error UI
* monitoring infrastructure
* individual API endpoint contracts

These belong to their respective architecture documents.

---

# 34. Design Principle

The API architecture should make failures:

> **Predictable for clients and diagnosable for engineers.**

The frontend should understand application-level errors.

The backend should understand the underlying technical failures.

GitHub-specific implementation details should remain inside the GitHub integration boundary.

A failure must never cause the system to silently lose the desired state.
