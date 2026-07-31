# PetHealth — Architecture guide

> Reference document for development. It is the frame Claude Code works within:
> all generated code must respect the structure and conventions below.

## Vision

PetHealth manages the **health records** of pets. The user scans (browser-side
camera capture) their pet's documents — vaccination booklet, prescriptions, lab
results, certificates — and the app stores them in **Google Drive**. A
**household** (couple, family) can share the follow-up of the same pet.

Scanning happens **client-side** (in the browser): a web app cannot write to the
device's storage, so files travel to the cloud (Google Drive).

## Stack

- **Monorepo**: pnpm workspaces (`apps/*`, `packages/*`)
- **Backend**: NestJS 11, Prisma 7, PostgreSQL 17
- **Frontend**: Next.js 16 (App Router, Turbopack, React Compiler)
- **Shared types**: `@pethealth/shared` package (referenced as `workspace:*`)
- **Containerization**: Docker Compose (dev), `node:24-alpine` images

## Architecture principles

1. **Modular monolith** — a single deployable, split into strongly isolated
   bounded contexts.
2. **Domain-Driven Design (tactical)** — rich entities, value objects and domain
   events in the core context.
3. **Hexagonal architecture (ports & adapters)** — the domain depends on no
   framework and no infrastructure.
4. **Reference by identifier** — a context never references another context's
   entities; it stores an `id` (string). No cross-imports of domain objects.

## Subdomains & bounded contexts

| Context           | Subdomain    | Role                                                       |
|-------------------|--------------|------------------------------------------------------------|
| `health-document` | **Core**     | Where the value is: health documents, Google Drive storage  |
| `pet`             | Supporting   | Pet profiles                                                |
| `household`       | Supporting   | Household and sharing between members                       |
| `invitation`      | Supporting   | Link-based invitations to join a household                  |
| `user`            | Supporting   | User accounts and account deletion                          |
| `auth`            | Generic      | Authentication — **keep it simple, no DDD**                 |

Modelling effort is concentrated on the **core** (`health-document`). The
*supporting* contexts stay correct but plain. The *generic* one (`auth`) uses a
classic NestJS module or an auth library — we don't reinvent authentication.

## Context map

Relationships are established **by identifier**, never by importing an entity:

```
health-document --(petId)--> pet --(householdId)--> household --(userId)--> auth
health-document --(DocumentStorage port)--> Google Drive  [external system]
```

## Document storage model

- **PostgreSQL** stores the **metadata**: pet, household, document (type, date,
  tags) and the Drive file `id`.
- **Google Drive** stores the **bytes** (the files themselves).
- OAuth scope: **`drive.file`** only (non-sensitive — avoids *restricted*
  verification and the annual security audit). The app only accesses the files
  it created.
- Google Drive is **hidden behind a `DocumentStorage` port**. The domain doesn't
  know Drive exists; it could be swapped for S3 or Dropbox by writing another
  adapter.

## Folder structure

```
apps/api/src/
├── contexts/
│   ├── health-document/                    ← Core
│   │   ├── domain/                          (pure, zero framework/infra dependency)
│   │   │   ├── health-document.entity.ts        rich entity
│   │   │   ├── document-type.vo.ts              value object
│   │   │   ├── health-document.repository.ts    PORT (interface)
│   │   │   └── document-storage.port.ts         PORT (Drive abstraction)
│   │   ├── application/                     (use cases orchestrating the domain)
│   │   │   ├── upload-document.use-case.ts
│   │   │   └── list-pet-documents.use-case.ts
│   │   ├── infrastructure/                  (adapters = port implementations)
│   │   │   ├── prisma-health-document.repository.ts
│   │   │   ├── google-drive-storage.adapter.ts      ← implements DocumentStorage
│   │   │   └── health-document.mapper.ts            domain ↔ Prisma model
│   │   ├── presentation/
│   │   │   └── health-document.controller.ts
│   │   └── health-document.module.ts
│   ├── pet/                                 ← Supporting (same structure)
│   ├── household/                           ← Supporting (same structure)
│   ├── invitation/                          ← Supporting (same structure)
│   └── user/                                ← Supporting (same structure)
├── auth/                                    ← Generic (plain module, no DDD layers)
├── authorization/                           cross-cutting: household membership guard
├── shared/                                  kernel: base Entity, ValueObject, DomainEvent
│   └── domain/
├── infrastructure/                          cross-cutting
│   └── prisma/
│       └── prisma.service.ts
├── app.module.ts
└── main.ts
```

`contexts/` groups the bounded contexts and visually separates them from the
technical plumbing (`shared`, `infrastructure`, `auth`). It is an organizational
convention, not a NestJS constraint.

## Dependency rule

```
presentation → application → domain
infrastructure → domain
```

The `domain` depends on **nothing**. That is what makes adapters swappable.

Layers, per context:

- **`domain/`** — entities, value objects, domain events, **ports** (repository
  and external-service interfaces). Pure TypeScript, no framework/infra
  dependency.
- **`application/`** — use cases orchestrating the domain through the ports.
- **`infrastructure/`** — adapters: Prisma repository implementations, Google
  Drive adapter, domain ↔ Prisma mappers.
- **`presentation/`** — NestJS controllers, HTTP DTOs.

## Conventions

- **Ports in the domain, adapters in the infrastructure.** For example: the
  `DocumentStorage` port is defined in `health-document/domain/`, its
  `GoogleDriveStorageAdapter` implementation in `health-document/infrastructure/`.

- **Inject interfaces by token.** TypeScript interfaces don't exist at runtime.
  Define a token and bind it in the module:

  ```ts
  // health-document.module.ts
  providers: [
    UploadDocumentUseCase,
    { provide: 'HealthDocumentRepository', useClass: PrismaHealthDocumentRepository },
    { provide: 'DocumentStorage', useClass: GoogleDriveStorageAdapter },
  ]

  // upload-document.use-case.ts
  constructor(
    @Inject('DocumentStorage') private readonly storage: DocumentStoragePort,
    @Inject('HealthDocumentRepository') private readonly repo: HealthDocumentRepository,
  ) {}
  ```

- **Prisma mapping.** Prisma models are anemic. Each infrastructure repository
  maps between the Prisma model and the rich domain entity through a dedicated
  mapper. The domain **never imports** a Prisma type.

- **Rich entities.** Business logic lives in domain entities and value objects,
  not in application services (avoid the anemic model).

- **No cross-context imports.** Communication happens by `id`. To react to what
  happens in another context, use **domain events**, not a direct call.

## MVP scope

**Included**: auth (basic), pet profiles, household + sharing between members,
upload and listing of documents to Google Drive.

**Later**: reminders/notifications (vaccine due dates), PDF export of a record,
document OCR, insurance, nutrition.
