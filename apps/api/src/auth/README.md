# Authentication — the `auth` module

> **Generic** subdomain: a plain NestJS module, no DDD layers.
> **Google is the only way to sign in.** Afterwards the app issues and verifies
> only its **own** session (a JWT in a cookie) — Google tokens only serve to
> establish identity at login time.

## Contents

1. [The Strategy pattern](#1-the-strategy-pattern)
2. [Passport + NestJS](#2-passport--nestjs)
3. [The files](#3-the-files)
4. [The two scenarios](#4-the-two-scenarios)
5. [Mental models](#5-mental-models)
6. [Configuration](#6-configuration)

---

## 1. The Strategy pattern

"Authenticating a request" is a task that can be done in **several interchangeable
ways** (Google OAuth, session JWT, password, API key…). The **Strategy** pattern
isolates each way in its own class; the calling code picks one without knowing
its details.

```
┌─────────────┐   delegates to   ┌──────────────────────┐
│  Context    │ ───────────────► │  Strategy (contract) │
└─────────────┘                  └──────────────────────┘
                                  ▲              ▲
                          ┌───────┘              └───────┐
                  ┌──────────────┐              ┌──────────────┐
                  │ Google OAuth │              │     JWT      │
                  └──────────────┘              └──────────────┘
```

- **Strategy**: the shared contract ("verify a request's identity").
- **ConcreteStrategy**: each implementation.
- **Context**: delegates to *one* strategy.

Benefit: adding an auth method tomorrow means writing **one new strategy**
(+ a guard), without touching the existing controllers.

## 2. Passport + NestJS

**`passport` is the `Context`.** It doesn't know *how* to authenticate: it
delegates to **strategies registered under a name** (`'google'`, `'jwt'`). Each
strategy exposes a **`validate()`** method. Passport:

1. runs the mechanics specific to the strategy (the OAuth dance, or JWT signature
   verification…);
2. calls `validate()` with the raw result;
3. puts **whatever `validate()` returns** into **`req.user`**.

> 🔑 **Golden rule: what `validate()` returns becomes `req.user`.**

NestJS adds two tools:

- **`PassportStrategy(Strategy, 'name')`** — a *mixin* turning a Passport strategy
  into an injectable NestJS class. The `super({...})` call configures the
  strategy; your `validate()` is the hook Passport calls.
- **`AuthGuard('name')`** — the guard you put on a route (`@UseGuards`). It
  triggers the named strategy; on success `req.user` is populated, otherwise
  **401**.

## 3. The files

| File | Role |
|---|---|
| `strategies/google.strategy.ts` | Google OAuth strategy (scopes `openid email profile`). Its `validate()` **finds or creates** the local user through `FindOrCreateGoogleUserUseCase`, then returns `{ id, email }`. Used to **get in**. |
| `strategies/jwt.strategy.ts` | JWT strategy. Extracts the token from the cookie, verifies **signature + expiration**, then `validate(payload)` shapes `req.user`. Used to **stay signed in**. |
| `guards/google-auth.guard.ts` | `AuthGuard('google')` — kicks off the OAuth flow. |
| `guards/jwt-auth.guard.ts` | `AuthGuard('jwt')` — protects a route. |
| `auth.service.ts` | **Signs** the session JWT (`@nestjs/jwt`). The "write" side of `passport-jwt` (which reads). |
| `auth.controller.ts` | Routes `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/me`, `POST /auth/logout`. |
| `auth.constants.ts` | Cookie name, session lifetime, `JwtPayload` / `AuthenticatedUser` types. |
| `auth.module.ts` | Registers strategies + service, configures `JwtModule`, imports `UserModule`. |

Outside the module: `cookie-parser` is wired in `src/main.ts` (reads incoming
cookies → `req.cookies`).

### Dependencies and their roles

- `passport` — the orchestrator (Context).
- `@nestjs/passport` — glues Passport ↔ NestJS (`PassportStrategy`, `AuthGuard`).
- `passport-google-oauth20` — the "get in via Google" strategy.
- `passport-jwt` — the "stay signed in" strategy (reads/verifies the JWT).
- `@nestjs/jwt` — builds/signs the JWT (writes).
- `cookie-parser` — carries the JWT in an httpOnly cookie.

## 4. The two scenarios

### Sign-in (Google)

```
Browser               API (NestJS)                     Google
    │  GET /auth/google     │                             │
    │──────────────────────►│ GoogleAuthGuard             │
    │   302 redirect        │  → google strategy redirects │
    │◄──────────────────────┤                             │
    │  ────────────────────────────────────────────────► (login + consent)
    │   302 /auth/google/callback?code=...                │
    │◄────────────────────────────────────────────────────┤
    │  GET /callback?code=  │                             │
    │──────────────────────►│ google strategy:            │
    │                       │   exchanges the code ──────► tokens + profile
    │                       │   validate(profile)          │
    │                       │     find-or-create User      │
    │                       │     req.user = {id,email}    │
    │                       │ handler: signs JWT → cookie  │
    │   302 to the frontend │   Set-Cookie: access_token   │
    │◄──────────────────────┤                             │
```

### Authenticated request (`/auth/me`)

```
Browser                            API
   │  GET /auth/me  (Cookie: access_token=...) │
   │──────────────────────────────────────────►│ cookie-parser → req.cookies
   │                                           │ JwtAuthGuard → jwt strategy:
   │                                           │   extracts the JWT from the cookie
   │                                           │   verifies signature + expiration
   │                                           │   validate(payload) → req.user
   │   200 { userId, email }                   │ handler: return req.user
   │◄──────────────────────────────────────────┤
```

## 5. Mental models

1. **What `validate()` returns = `req.user`.** Everything revolves around that.
2. **Two strategies = two moments**: Google to **get in** (once), JWT to **stay
   in** (on every request).
3. **The guard is the switch**: `@UseGuards(AuthGuard('x'))` = "this route
   requires strategy x".
4. **Read/write separation for the JWT**: `@nestjs/jwt` signs (outbound),
   `passport-jwt` verifies (inbound).
5. **Open for extension**: a new auth method = a new strategy + a guard, without
   modifying what exists.

## 6. Configuration

Environment variables (see `.env.example` at the repo root):

| Variable | Role |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth client (Google Cloud Console). |
| `GOOGLE_CALLBACK_URL` | Authorized redirect URI (`/auth/google/callback`). |
| `JWT_SECRET` | Signing secret for the app session. |
| `FRONTEND_URL` | Where to redirect the browser after login. |

Without real credentials, **non-empty dev fallbacks** let the app boot (an empty
`clientID` is rejected by `passport-oauth2`); an actual login requires setting
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### Note: local auth (argon2)

An email/password auth path (`Password` value object, `PasswordHasher` port,
**argon2** adapter) exists in the `user` context, **tested but not exposed** (no
sign-up route). Kept as a demonstration; the active sign-in path is **Google
only**.

### Coming next

- Protect the other contexts' routes with `JwtAuthGuard`.
- Along with the `health-document` context: add the **`drive.file`** scope,
  *offline* access, and **encrypted storage of the refresh token** (Google Drive
  access).
