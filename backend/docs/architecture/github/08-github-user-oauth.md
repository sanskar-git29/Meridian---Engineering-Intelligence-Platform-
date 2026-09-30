# Phase 8 — GitHub User OAuth & Identity

## 1. Purpose

Phase 8 connects an individual Medit user to their GitHub account.

This establishes a trusted GitHub identity for a Medit user so that later synchronization and collaboration features can associate Medit users with their GitHub accounts.

This phase handles **identity**, not repository authorization.

---

## 2. Architectural Distinction

Medit has two separate GitHub relationships.

### Organization-level connection

Implemented in Phase 4:

```text
Medit Organization
        │
        │ GitHub App Installation
        ▼
GitHub Organization
```

This represents the GitHub organization owned/managed by the client.

### User-level connection

Implemented in Phase 8:

```text
Medit User
        │
        │ GitHub OAuth
        ▼
GitHub User
```

This represents the GitHub identity belonging to an individual Medit user.

These relationships must remain independent.

A user's GitHub connection must never determine whether that user can access a repository.

Repository authorization continues to use:

```text
User
 ↓
Organization Membership
 ↓
Team Membership
 ↓
Team ↔ Repository Permission
 ↓
Repository Access
```

---

# 3. Scope

Phase 8 includes:

- GitHub OAuth authorization start
- OAuth state generation
- OAuth state validation
- OAuth callback
- Server-side authorization-code exchange
- GitHub identity retrieval
- GitHub user identity validation
- `GitHubUser` persistence
- GitHub connection status
- Current-user connection endpoint
- GitHub disconnect endpoint
- Cross-user isolation
- Organization isolation
- OAuth security tests
- Integration tests
- Error normalization

Phase 8 does not include:

- SyncJob worker
- BullMQ
- GitHub team synchronization
- GitHub team mutations
- Repository permission synchronization
- Reconciliation
- Webhooks
- Pull-request APIs
- Commit APIs
- CI/CD APIs
- Engineering activity APIs
- AI/correlation logic

---

# 4. API Contract

## 4.1 Get Current GitHub Connection

```http
GET /api/github/users/me/connection
```

Authentication:

```text
Required
```

Authorization:

```text
Any active organization member
```

The endpoint returns only the authenticated user's GitHub connection.

The client must not provide:

```text
userId
organizationId
githubUserId
```

The backend derives the user and organization from the authenticated access token.

### Connected response

```json
{
  "success": true,
  "data": {
    "connected": true,
    "githubUser": {
      "id": "medit-github-user-uuid",
      "githubUserId": 12345678,
      "login": "github-user",
      "avatarUrl": "https://avatars.githubusercontent.com/..."
    },
    "status": "CONNECTED"
  }
}
```

### Not connected response

```json
{
  "success": true,
  "data": {
    "connected": false,
    "githubUser": null,
    "status": "DISCONNECTED"
  }
}
```

Sensitive OAuth information must never appear in this response.

---

# 5. OAuth Start

```http
POST /api/github/users/me/connection
```

Authentication:

```text
Required
```

Authorization:

```text
Any active organization member
```

The endpoint starts the GitHub OAuth flow.

The backend must:

1. Authenticate the Medit user.
2. Resolve the user's organization from the authenticated context.
3. Generate a cryptographically secure OAuth state.
4. Bind the state to:
   - Medit user ID
   - organization ID
   - expiration time
5. Store the state server-side.
6. Generate the GitHub authorization URL.
7. Return the authorization URL.

Example:

```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://github.com/login/oauth/authorize?... "
  }
}
```

The frontend may redirect the browser to this URL.

The frontend must not generate or validate OAuth state.

---

# 6. OAuth State

OAuth state is a security mechanism against authorization-request forgery.

The state must be:

- cryptographically random
- short-lived
- single-use
- server-side validated
- bound to the authenticated Medit user
- bound to the authenticated organization

Recommended expiration:

```text
10 minutes
```

The state record should conceptually contain:

```text
state
userId
organizationId
expiresAt
usedAt
createdAt
```

The state must be invalid if:

```text
state does not exist
OR
state is expired
OR
state was already consumed
OR
state belongs to another user
OR
state belongs to another organization
```

After successful validation, the state must be consumed so it cannot be reused.

The raw OAuth state must never be logged.

---

# 7. OAuth Callback

```http
GET /api/github/users/me/connection/callback
```

GitHub redirects the browser to this endpoint.

Expected query parameters:

```text
code
state
error
error_description
```

The callback must not trust the `state` or `code` by itself.

Flow:

```text
GitHub
  │
  │ code + state
  ▼
Callback
  │
  ├── validate state
  │
  ├── consume state
  │
  ├── exchange code server-side
  │
  ├── retrieve GitHub user
  │
  ├── validate GitHub identity
  │
  └── persist GitHubUser
```

---

# 8. Authorization Code Exchange

The authorization code must be exchanged by the backend.

The following must remain server-side:

```text
GitHub OAuth client ID
GitHub OAuth client secret
authorization code exchange
GitHub access token
```

The frontend must never receive the GitHub access token.

The access token must never be:

- returned in an API response
- included in application logs
- included in audit logs
- stored in `GitHubUser`
- exposed through error messages

Phase 8 does not require persistent storage of the OAuth access token because this phase only establishes the GitHub identity.

If future functionality requires persistent user-level GitHub credentials, that will be designed as a separate security decision.

---

# 9. GitHub Identity Retrieval

After exchanging the authorization code, the backend retrieves the authenticated GitHub user.

The provider should normalize the GitHub response into an internal type.

Conceptually:

```ts
interface GitHubUserInfo {
  id: number;
  login: string;
  avatarUrl: string | null;
}
```

The GitHub numeric user ID is the immutable external identity anchor.

The GitHub login is mutable and therefore must not be used as the primary identity.

---

# 10. GitHubUser Persistence

Existing model:

```prisma
model GitHubUser {
  id           String           @id @default(uuid())
  userId       String           @unique
  githubUserId BigInt           @unique
  login        String
  avatarUrl    String?
  status       GitHubUserStatus
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  user         User             @relation(fields: [userId], references: [id], onDelete: Restrict)
}
```

Existing status:

```prisma
enum GitHubUserStatus {
  CONNECTED
  DISCONNECTED
}
```

This model remains the identity record.

The system must not create duplicate GitHub identities.

---

# 11. Connection Rules

## First connection

If no `GitHubUser` exists:

```text
create GitHubUser
status = CONNECTED
```

## Reconnection

If the existing record belongs to the same Medit user and the same GitHub user:

```text
status = CONNECTED
update login
update avatarUrl
```

## Disconnect

```text
status = DISCONNECTED
```

The record must not be deleted.

Historical identity association must remain available.

---

# 12. Identity Conflict

A GitHub identity must not be attached to multiple Medit users.

Because:

```prisma
githubUserId BigInt @unique
```

already exists, the database provides an additional invariant.

If GitHub user `12345` is already connected to another Medit user, the new connection must be rejected.

Return a stable application error rather than exposing database errors.

Suggested error:

```text
GITHUB_USER_ALREADY_CONNECTED
```

HTTP status:

```text
409 Conflict
```

---

# 13. User Conflict

A Medit user may have only one GitHub identity.

Because:

```prisma
userId String @unique
```

already exists, attempting to connect another GitHub account must not silently replace the existing identity.

If the user already has a different GitHub identity connected:

```text
reject the connection
```

Suggested error:

```text
GITHUB_CONNECTION_EXISTS
```

HTTP status:

```text
409 Conflict
```

A future explicit "replace GitHub account" workflow can be designed separately.

---

# 14. Disconnect

```http
DELETE /api/github/users/me/connection
```

Authentication:

```text
Required
```

Authorization:

```text
Any active organization member
```

The backend identifies the user from the authenticated context.

No `userId` is accepted from the frontend.

If connected:

```text
CONNECTED → DISCONNECTED
```

If already disconnected:

The operation should be idempotent.

The backend must not delete the `GitHubUser` row.

---

# 15. Organization Isolation

The GitHub user identity model is user-global:

```text
userId → GitHubUser
```

However, every API request must still validate the authenticated user's active organization membership.

The OAuth state must contain the organization context.

A callback must never be allowed to associate a GitHub identity with a different organization context than the one that initiated the flow.

The frontend must never provide the organization ID to control this relationship.

---

# 16. Authorization

### MEMBER

Can:

- start their own GitHub OAuth flow
- view their own GitHub connection
- disconnect their own GitHub account

Cannot:

- view another user's GitHub identity
- connect another user's GitHub account
- disconnect another user's GitHub account

### ADMIN

Can:

- perform the same self-service GitHub connection operations

ADMIN does not gain permission to manipulate another user's GitHub identity through these endpoints.

### OWNER

Same rule.

GitHub user identity is user-owned, so even organization management roles operate on their own connection.

---

# 17. Repository Authorization Relationship

GitHub OAuth must never be used as repository authorization.

For example:

```text
User A
 ├── GitHub connected
 └── no team access to Repository X
```

User A must still receive:

```text
REPOSITORY_ACCESS_DENIED
```

for Repository X.

Likewise:

```text
User B
 ├── GitHub not connected
 └── authorized through Medit team permissions
```

User B can still access authorized Medit repository data.

The missing GitHub identity only affects future GitHub synchronization.

---

# 18. Future Synchronization Interaction

Phase 8 establishes the identity required by later synchronization.

Example:

```text
Medit Team Membership
        │
        ├── GitHubUser exists
        │       └── future sync can resolve GitHub identity
        │
        └── GitHubUser missing
                └── synchronization must wait
```

The synchronization state such as:

```text
GITHUB_IDENTITY_MISSING
```

belongs to the later SyncJob architecture.

Phase 8 must not implement that worker behavior.

---

# 19. Provider Responsibilities

The existing GitHub provider/client abstraction must remain the only place responsible for GitHub HTTP communication.

OAuth-specific provider functionality should be centralized.

Conceptually:

```text
GitHubClient
    │
    ├── App authentication
    ├── Installation API
    └── OAuth HTTP communication

GitHubProvider
    │
    ├── normalize GitHub API responses
    ├── exchange authorization code
    └── retrieve GitHub user identity
```

Controllers and services must not directly call `fetch()` against GitHub.

---

# 20. Service Responsibilities

The service owns business rules.

The service should:

1. Resolve authenticated user/org context.
2. Generate OAuth state.
3. Store state.
4. Generate authorization URL.
5. Validate callback state.
6. Consume state.
7. Exchange authorization code through provider.
8. Retrieve GitHub identity.
9. Detect identity conflicts.
10. Persist/update `GitHubUser`.
11. Return sanitized application data.

The controller should remain thin.

---

# 21. Repository Responsibilities

The repository owns database operations.

It should provide focused operations such as:

```text
createOAuthState
findOAuthState
consumeOAuthState

findGitHubUserByUserId
findGitHubUserByGitHubId
createGitHubUser
updateGitHubUserStatus
updateGitHubUserIdentity
```

Queries must be tenant-aware where organization context is part of the operation.

Existing `withTenant(...)` infrastructure should be reused where applicable.

---

# 22. OAuth State Storage

OAuth state must have durable server-side storage.

Do not rely on:

```text
frontend localStorage
frontend state
URL-only state
in-memory process state
```

The implementation should use the existing application persistence/infrastructure where appropriate.

State records must have an expiration mechanism and single-use semantics.

Concurrent callback attempts must not be able to consume the same state successfully twice.

---

# 23. Error Contract

Use the existing `ApiErrorResponse` structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Safe human-readable message",
    "requestId": "request-id"
  }
}
```

Relevant stable errors include:

```text
AUTH_REQUIRED
FORBIDDEN
GITHUB_AUTH_FAILED
GITHUB_NOT_FOUND
GITHUB_UNAVAILABLE
GITHUB_API_ERROR

GITHUB_OAUTH_STATE_INVALID
GITHUB_OAUTH_STATE_EXPIRED
GITHUB_OAUTH_STATE_USED
GITHUB_OAUTH_ACCESS_DENIED
GITHUB_CONNECTION_EXISTS
GITHUB_USER_ALREADY_CONNECTED
```

Exact error codes should follow the existing error conventions if an equivalent code already exists.

Never expose:

- OAuth tokens
- authorization codes
- OAuth client secrets
- GitHub raw error payloads
- internal database errors

---

# 24. Callback Response

The callback should not expose the GitHub access token.

After successful connection, the backend may redirect the browser back to the frontend.

The redirect destination must come from trusted server configuration, not an arbitrary query parameter.

Example conceptual flow:

```text
GitHub
  ↓
Backend callback
  ↓
successful identity connection
  ↓
frontend connection page
```

Do not create an open redirect.

---

# 25. Security Requirements

The implementation must protect against:

### CSRF / authorization-request forgery

Protected by:

```text
random state
+
server-side state storage
+
user binding
+
organization binding
+
expiration
+
single use
```

### OAuth callback replay

A consumed state cannot be reused.

### Cross-user callback

A state generated for User A cannot authenticate a GitHub account for User B.

### Cross-organization callback

A state generated in Organization A cannot be used in Organization B.

### Account takeover through identity replacement

A different GitHub identity cannot silently replace an existing connection.

### GitHub identity collision

One GitHub identity cannot be attached to multiple Medit users.

### Token leakage

OAuth access tokens must remain server-side and transient in Phase 8.

### Open redirect

Callback redirects must use trusted configured destinations.

---

# 26. Testing Requirements

Phase 8 is not complete until the following tests exist.

## OAuth state

Test:

- generates secure state
- persists state
- expires correctly
- rejects unknown state
- rejects expired state
- rejects already-used state
- rejects state belonging to another user
- rejects state belonging to another organization
- prevents concurrent double consumption

## OAuth flow

Test:

- starts OAuth successfully
- generates correct GitHub authorization URL
- handles successful callback
- exchanges code server-side
- retrieves GitHub identity
- creates `GitHubUser`
- reconnects the same GitHub identity
- updates login/avatar metadata

## Conflict handling

Test:

- same Medit user connecting another GitHub account
- GitHub account already connected to another Medit user
- duplicate callback

## Connection APIs

Test:

- unauthenticated access rejected
- current user can view own connection
- user cannot access another user's connection
- connect endpoint does not accept userId
- disconnect works
- disconnect is idempotent

## Security

Test:

- OAuth token is never returned
- OAuth token is not logged
- raw GitHub OAuth errors are normalized
- callback cannot be used for another organization
- callback cannot be reused
- open redirect is prevented

## Regression

Run:

```bash
npm test
```

All existing Phase 1–7 tests must continue to pass.

---

# 27. Definition of Done

Phase 8 is complete only when:

- [ ] OAuth start endpoint exists
- [ ] OAuth callback exists
- [ ] OAuth state is server-side
- [ ] State is short-lived
- [ ] State is single-use
- [ ] State is bound to user and organization
- [ ] Authorization code is exchanged server-side
- [ ] GitHub identity is retrieved through the provider
- [ ] `GitHubUser` is persisted correctly
- [ ] Existing identity can reconnect
- [ ] Identity conflicts are rejected
- [ ] Disconnect is implemented
- [ ] Current-user connection endpoint is implemented
- [ ] Tokens never reach frontend
- [ ] Raw OAuth errors never reach frontend
- [ ] Cross-user isolation is tested
- [ ] Cross-organization isolation is tested
- [ ] OAuth replay is tested
- [ ] Full regression suite passes
- [ ] No SyncJob/team-sync/reconciliation functionality has been added prematurely

---

# 28. Expected Architecture

The final Phase 8 flow should fit the existing backend:

```text
routes
  │
  ▼
controller
  │
  ▼
service
  │
  ├──────────────► authorization
  │
  ├──────────────► repository
  │
  └──────────────► GitHub provider
                         │
                         ▼
                    GitHub Client
                         │
                         ▼
                    GitHub OAuth
```

Database:

```text
User
 │
 └── GitHubUser
       ├── githubUserId
       ├── login
       ├── avatarUrl
       └── status

OAuthState
       ├── userId
       ├── organizationId
       ├── state
       ├── expiresAt
       └── usedAt
```

Phase 8 establishes the identity foundation.

It does not yet synchronize that identity with GitHub teams or repositories.