# 🐾 PetHealth

**The digital health record for your pets.**

PetHealth lets you scan your pet's health documents (vaccination records,
prescriptions, lab results…) straight from the browser, store them in your
own Google Drive, and share the follow-up with the members of your household.

> 💼 Personal project built as a technical showcase: the focus is on
> architecture (DDD, hexagonal) as much as on the product itself.
> See [ARCHITECTURE.md](ARCHITECTURE.md) for the design decisions in detail.

<!-- TODO: screenshot or demo GIF
![PetHealth preview](docs/screenshot.png)
-->

## ✨ Features

- 📸 **Document scanning** — in-browser camera capture, no native app required
- ☁️ **Google Drive storage** — files stay in the user's own Drive
  (OAuth scope `drive.file`: the app can only access files it created)
- 🐕 **Pet profiles** — multiple pets per household, each with typed and
  dated documents
- 👨‍👩‍👧 **Shared household** — link-based invitations, role and member
  management so several people can track the same pets
- 🔐 **Sign in with Google** — OAuth authentication, account management and
  data deletion

## 🏗️ Tech stack

| Layer | Technologies |
|---|---|
| Backend | [NestJS 11](https://nestjs.com/), [Prisma 7](https://www.prisma.io/), PostgreSQL 17 |
| Frontend | [Next.js 16](https://nextjs.org/) (App Router, React Compiler), Tailwind CSS, TanStack Query |
| Monorepo | pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`) |
| Dev infra | Docker Compose, `node:24-alpine` images |
| External | Google OAuth 2.0, Google Drive API |

## 📐 Architecture

The backend is a **modular monolith** split into bounded contexts
(tactical DDD), each structured as a **hexagonal architecture**
(ports & adapters):

```
apps/api/src/contexts/
├── health-document/   ← Core: health documents, DocumentStorage port (Drive)
│   ├── domain/          rich entities, value objects, ports (zero framework dependency)
│   ├── application/     use cases
│   ├── infrastructure/  Prisma & Google Drive adapters, mappers
│   └── presentation/    NestJS controllers
├── pet/               ← pet profiles
├── household/         ← household and sharing
├── invitation/        ← link-based invitations
└── user/              ← user accounts
```

Key principles:

- The `domain/` layer depends on nothing — no framework, no Prisma. Adapters
  are swappable (Drive could be replaced by S3 without touching the domain).
- No cross-context imports: contexts communicate by identifier only.
- The frontend follows the **Feature-Sliced Design** methodology.

➡️ The full reasoning (subdomains, context map, conventions) is documented
in [ARCHITECTURE.md](ARCHITECTURE.md).

## 🚀 Getting started

### Prerequisites

- **Node.js 24+** and pnpm (via `corepack enable pnpm`)
- **Docker** with Docker Compose
- A **Google OAuth client** ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))
  with the Google Drive API enabled

### Run the project

```bash
# 1. Clone and install dependencies
git clone https://github.com/<user>/pethealth.git
cd pethealth
pnpm install

# 2. Configure the environment
cp .env.example .env
# → fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

# 3. Start everything (PostgreSQL + API + Web)
docker compose up --build
```

- Frontend: http://localhost:3001
- API: http://localhost:3000

### Useful commands

```bash
pnpm --filter api start:dev                  # API only (outside Docker)
pnpm --filter web dev                        # Frontend only
pnpm --filter api exec prisma migrate dev    # Database migration
pnpm --filter api exec prisma generate       # (Re)generate the Prisma client
```

> ℹ️ The Prisma CLI runs on the host and expects `localhost:5432` in
> `DATABASE_URL`, while the API inside the container uses `postgres:5432`.

## 🗺️ Roadmap

- [x] Google authentication and account management
- [x] Pet profiles
- [x] Household, link-based invitations and member management
- [x] Document scanning and upload to Google Drive
- [ ] Vaccination reminders and due dates
- [ ] Consolidated health history
- [ ] PDF export of a pet's record
- [ ] OCR on scanned documents

## 📄 License

Personal project — source available for demonstration purposes.
