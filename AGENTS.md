# PetHealth

Health-record management app for pets: scanning (browser-side camera capture)
and storage of documents in Google Drive, with follow-up shared across a
household.

## Stack

pnpm monorepo — NestJS 11 backend (`apps/api`), Next.js 16 App Router frontend
(`apps/web`), shared types (`packages/shared`). Prisma 7 + PostgreSQL 17.
Dev environment orchestrated with Docker Compose.

## Prerequisites

- **Node 24** required (Node 20 breaks Corepack/pnpm → `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`).
- pnpm via Corepack (`corepack enable pnpm`).

## Commands

- Run everything (dev)      : `docker compose up --build`
- A single app              : `pnpm --filter <api|web> dev` (api: `start:dev`)
- Install dependencies      : `pnpm install` (from the repo root)
- After adding a dep with build scripts: `pnpm approve-builds`
- Prisma migration          : `pnpm --filter api exec prisma migrate dev`
- (Re)generate the client   : `pnpm --filter api exec prisma generate`

## Architecture

Modular monolith + tactical DDD + hexagonal architecture (ports & adapters).

**Mandatory frame of reference: @ARCHITECTURE.md** (the `ARCHITECTURE.md` file at
the repo root — read it before generating any code). All generated code must
respect the bounded-context split, the layer structure and the conventions
described there.

The frontend follows its own rules, documented in `apps/web/AGENTS.md`
(Feature-Sliced Design, TanStack Query, Adapter pattern — no DDD on the web side).

Non-negotiable rules:

- `domain/` depends on nothing (no framework, no infrastructure, no Prisma).
- Ports live in `domain/`, adapters in `infrastructure/`.
- Inject interfaces by NestJS **token**: `{ provide: 'X', useClass: ... }` + `@Inject('X')`.
- No cross-context imports: reference by `id` (string), never by entity.
- Business logic belongs in entities / value objects, not in services (no anemic model).

## Things to know

- **Two `DATABASE_URL`s** for the same database: the Prisma CLI (on the host) uses
  `localhost:5432`; NestJS inside the container uses `postgres:5432` (the Docker
  service name).
- **Prisma 7**: the client is generated into `apps/api/src/generated/prisma`
  (gitignored); Prisma models are anemic → map them to domain entities.
- **Google Drive**: OAuth scope `drive.file` only (non-sensitive), hidden behind
  the `DocumentStorage` port.
- **Code comments must be written in English.**

## Don'ts

- Don't import a Prisma type into `domain/` → go through a mapper.
- Don't call one context directly from another → reference by `id` or domain event.
- Don't over-model `auth` (generic subdomain) → a plain NestJS module.
- Don't commit `.env` or the generated Prisma client (already in `.gitignore`).
