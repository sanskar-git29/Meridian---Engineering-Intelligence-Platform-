Meridian

Engineering Intelligence Platform — a single dashboard that helps founders and engineering leaders understand what's happening across AWS spend, AI/API usage, GitHub activity, security posture, and engineering activity — and, most importantly, why it's happening.

🚀 What is Meridian?

Modern engineering teams use many disconnected systems:

Area

Data Source Examples

☁️ Cloud

AWS, GCP, Azure

🤖 AI

OpenAI, Anthropic, Gemini

💻 Development

GitHub, GitLab

🔐 Security

Secret & dependency scanners

👥 Engineering

Activity & collaboration systems

These tools show individual metrics, but they rarely explain how those metrics relate to each other.

Meridian is designed to connect those signals and turn raw engineering data into grounded, actionable insights.

Instead of

AWS cost increased 25%.

Meridian aims to show

AWS spending increased 25%, primarily from the Payments team. A recent deployment increased EC2 resources, contributing approximately $3,000/month in additional cost. Several instances appear underutilized, with an estimated $1,200/month in potential savings.

🎯 Core Product

Meridian answers one central question:

What is happening in our engineering organization, why is it happening, and what should we do about it?

The platform combines:

Capability

Purpose

☁️ AWS Cost Intelligence

Track cloud spending by service, team, project, and environment

🤖 AI/API Intelligence

Track usage, tokens, costs, and unusual spikes

💻 GitHub Intelligence

Analyze repositories, PRs, reviews, deployments, and activity

🔐 Security Center

Detect exposed secrets and vulnerable dependencies

👥 Engineering Activity

Provide privacy-conscious aggregated activity insights

🔗 Correlation Engine

Connect events across different systems

💡 Actionable Insights

Explain issues and suggest possible actions

💰 Cost Optimization

Identify potential infrastructure savings

📊 Executive Dashboard

Give founders a simple company-wide overview

## Current phase: Backend skeleton

This is the earliest possible slice of the backend — intentionally minimal so the foundation is solid before any real functionality is added.

**What exists right now:**
- Express server running on TypeScript, strict mode, ESM
- A single `GET /health` endpoint
- Production-shaped project conventions (`.gitignore`, `.env.example`, typed config, npm scripts) so nothing needs to be retrofitted later

**What does *not* exist yet (by design):**
- No database connection
- No routes beyond `/health`
- No authentication, RBAC, or multi-tenancy
- No integrations (AWS, GitHub, AI providers)
- No background jobs / queues

Each of these gets added deliberately in its own pass — see [Roadmap](#roadmap).

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | Catch integration bugs at compile time, not in production |
| Runtime | Node.js ≥ 20 | Current LTS, native ESM support |
| Framework | Express | Minimal, well-understood, easy to reason about middleware order |
| Module system | ESM (`"type": "module"`) | Matches the direction of the wider JS ecosystem and future frontend |
| Package manager | npm | Simplest, most universal choice for now |
| Dev runtime | [tsx](https://github.com/privatenumber/tsx) | Fast TS execution + watch mode without a separate build step |

Planned additions (not yet in this repo): Prisma + PostgreSQL, Redis + BullMQ, Docker, CI via GitHub Actions.

---

## Getting started

### Prerequisites
- Node.js ≥ 20 ([nvm](https://github.com/nvm-sh/nvm) recommended)
- npm ≥ 10 (ships with Node 20)

### Install & run

```bash
npm install
cp .env.example .env
npm run dev
```

The server starts on `http://localhost:4000` (or whatever `PORT` is set to in `.env`).

### Verify it's working

```bash
curl http://localhost:4000/health
# → {"status":"ok","uptimeSeconds":1.23}
```

---

## Environment variables

All required variables are documented in `.env.example`. Never commit a real `.env` file — it's gitignored by default.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `4000` | Port the HTTP server listens on |

---

## Project structure

```
meridian/
├── src/
│   └── index.ts        # Express app entrypoint
├── .env.example         # Documented env vars, safe to commit
├── .gitignore
├── tsconfig.json         # Strict TS config, NodeNext module resolution
├── package.json
└── README.md
```

As functionality is added, this grows into:

```
src/
├── config/       # Validated env loading
├── middleware/    # Error handling, logging, auth
├── routes/        # Route handlers, grouped by resource
├── lib/           # Shared clients (db, logger, etc.)
├── app.ts         # Express app construction (exported, not started)
└── index.ts       # Server bootstrap (imports app.ts, starts listening)
```

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (requires `npm run build` first) |
| `npm run typecheck` | Type-check the project without emitting output |

---

## Roadmap

- [x] **Phase 0 — Backend skeleton**: Express + TypeScript foundation, health check, project conventions
- [ ] **Phase 1 — AWS Cost Intelligence**: Postgres + Prisma, AWS integration, cost ingestion, anomaly detection
- [ ] **Phase 2 — GitHub Activity**: repos, PRs, deployments, review activity
- [ ] **Phase 3 — AI/API Usage**: OpenAI/Anthropic/Gemini usage and cost tracking, spike detection
- [ ] **Phase 4 — Security Center**: exposed secrets, vulnerable dependencies
- [ ] **Phase 5 — Correlation Engine**: cross-source insight generation grounded in real evidence
- [ ] **Phase 6 — Executive Dashboard**: unified founder-facing overview

---

## Contributing

This project is in early, active development — conventions here (folder structure, error handling, env validation) are the baseline every later addition should follow. If you're adding a new route or module, match the existing patterns rather than introducing a new one without discussion.

## License

Not yet decided — treat as proprietary/unlicensed until this section is updated.
