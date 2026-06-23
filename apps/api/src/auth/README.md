# Authentification — module `auth`

> Sous-domaine **generic** : module NestJS simple, sans couches DDD.
> **Google est l'unique méthode de connexion.** L'app n'émet et ne vérifie
> ensuite que sa **propre** session (JWT en cookie) — les jetons Google ne
> servent qu'à l'identité au moment du login.

## Sommaire

1. [Le pattern Strategy](#1-le-pattern-strategy)
2. [Passport + NestJS](#2-passport--nestjs)
3. [Les fichiers](#3-les-fichiers)
4. [Les deux scénarios](#4-les-deux-scénarios)
5. [Modèles mentaux](#5-modèles-mentaux)
6. [Configuration](#6-configuration)

---

## 1. Le pattern Strategy

« Authentifier une requête » est une tâche qui peut se faire de **plusieurs
façons interchangeables** (Google OAuth, JWT de session, mot de passe, clé
API…). Le pattern **Strategy** isole chaque façon dans sa propre classe ; le
code appelant en choisit une sans connaître ses détails.

```
┌─────────────┐   délègue à   ┌──────────────────────┐
│  Context    │ ────────────► │  Strategy (contrat)  │
└─────────────┘               └──────────────────────┘
                                  ▲              ▲
                          ┌───────┘              └───────┐
                  ┌──────────────┐              ┌──────────────┐
                  │ Google OAuth │              │     JWT      │
                  └──────────────┘              └──────────────┘
```

- **Strategy** : le contrat commun (« vérifier l'identité d'une requête »).
- **ConcreteStrategy** : chaque implémentation.
- **Context** : délègue à *une* stratégie.

Bénéfice : ajouter une méthode d'auth demain = écrire **une nouvelle stratégie**
(+ un guard), sans toucher aux contrôleurs existants.

## 2. Passport + NestJS

**`passport` est le `Context`.** Il ne sait pas *comment* authentifier : il
délègue à des **stratégies enregistrées par un nom** (`'google'`, `'jwt'`).
Chaque stratégie expose une méthode **`validate()`**. Passport :

1. exécute la mécanique propre à la stratégie (dialogue OAuth, ou vérif de
   signature JWT…) ;
2. appelle `validate()` avec le résultat brut ;
3. pose **ce que `validate()` retourne** dans **`req.user`**.

> 🔑 **Règle d'or : ce que `validate()` retourne devient `req.user`.**

NestJS ajoute deux outils :

- **`PassportStrategy(Strategy, 'nom')`** — un *mixin* qui transforme une
  stratégie Passport en classe NestJS injectable. Le `super({...})` configure la
  stratégie ; ton `validate()` est le hook appelé par Passport.
- **`AuthGuard('nom')`** — le guard à poser sur une route (`@UseGuards`). Il
  déclenche la stratégie nommée ; succès → `req.user` rempli, sinon **401**.

## 3. Les fichiers

| Fichier | Rôle |
|---|---|
| `strategies/google.strategy.ts` | Stratégie OAuth Google (scopes `openid email profile`). Sa `validate()` **retrouve ou crée** l'utilisateur local via `FindOrCreateGoogleUserUseCase`, puis retourne `{ id, email }`. Sert à **entrer**. |
| `strategies/jwt.strategy.ts` | Stratégie JWT. Extrait le jeton du cookie, vérifie **signature + expiration**, puis `validate(payload)` met en forme `req.user`. Sert à **rester connecté**. |
| `guards/google-auth.guard.ts` | `AuthGuard('google')` — déclenche le flux OAuth. |
| `guards/jwt-auth.guard.ts` | `AuthGuard('jwt')` — protège une route. |
| `auth.service.ts` | **Signe** le JWT de session (`@nestjs/jwt`). Pendant « écriture » de `passport-jwt` (lecture). |
| `auth.controller.ts` | Routes `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/me`, `POST /auth/logout`. |
| `auth.constants.ts` | Nom du cookie, durée de session, types `JwtPayload` / `AuthenticatedUser`. |
| `auth.module.ts` | Enregistre stratégies + service, configure `JwtModule`, importe `UserModule`. |

Hors module : `cookie-parser` est branché dans `src/main.ts` (lit les cookies
entrants → `req.cookies`).

### Dépendances et rôles

- `passport` — l'orchestrateur (Context).
- `@nestjs/passport` — colle Passport ↔ NestJS (`PassportStrategy`, `AuthGuard`).
- `passport-google-oauth20` — stratégie « entrer via Google ».
- `passport-jwt` — stratégie « rester connecté » (lecture/vérif du JWT).
- `@nestjs/jwt` — fabrique/signe le JWT (écriture).
- `cookie-parser` — transporte le JWT dans un cookie httpOnly.

## 4. Les deux scénarios

### Connexion (Google)

```
Navigateur            API (NestJS)                     Google
    │  GET /auth/google     │                             │
    │──────────────────────►│ GoogleAuthGuard             │
    │   302 redirect        │  → stratégie google redirige │
    │◄──────────────────────┤                             │
    │  ────────────────────────────────────────────────► (login + consentement)
    │   302 /auth/google/callback?code=...                │
    │◄────────────────────────────────────────────────────┤
    │  GET /callback?code=  │                             │
    │──────────────────────►│ stratégie google :          │
    │                       │   échange le code ─────────► tokens + profil
    │                       │   validate(profile)          │
    │                       │     find-or-create User      │
    │                       │     req.user = {id,email}    │
    │                       │ handler: signe JWT → cookie  │
    │   302 vers le front   │   Set-Cookie: access_token   │
    │◄──────────────────────┤                             │
```

### Requête authentifiée (`/auth/me`)

```
Navigateur                         API
   │  GET /auth/me  (Cookie: access_token=...) │
   │──────────────────────────────────────────►│ cookie-parser → req.cookies
   │                                           │ JwtAuthGuard → stratégie jwt :
   │                                           │   extrait le JWT du cookie
   │                                           │   vérifie signature + expiration
   │                                           │   validate(payload) → req.user
   │   200 { userId, email }                   │ handler: return req.user
   │◄──────────────────────────────────────────┤
```

## 5. Modèles mentaux

1. **Ce que `validate()` retourne = `req.user`.** Tout tourne autour de ça.
2. **Deux stratégies = deux moments** : Google pour **entrer** (une fois), JWT
   pour **rester** (à chaque requête).
3. **Le guard est l'interrupteur** : `@UseGuards(AuthGuard('x'))` = « ici, exige
   la stratégie x ».
4. **Séparation lecture/écriture du JWT** : `@nestjs/jwt` signe (sortie),
   `passport-jwt` vérifie (entrée).
5. **Ouvert à l'extension** : une nouvelle méthode d'auth = une nouvelle
   stratégie + un guard, sans modifier l'existant.

## 6. Configuration

Variables d'environnement (voir `.env.example` à la racine) :

| Variable | Rôle |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Client OAuth (Google Cloud Console). |
| `GOOGLE_CALLBACK_URL` | URI de redirection autorisée (`/auth/google/callback`). |
| `JWT_SECRET` | Secret de signature de la session applicative. |
| `FRONTEND_URL` | Où rediriger le navigateur après login. |

Sans credentials réelles, des **fallbacks de dev non vides** permettent à l'app
de démarrer (le `clientID` vide est rejeté par `passport-oauth2`) ; le vrai login
nécessite de renseigner `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### Note : auth locale (argon2)

Une auth email/mot de passe (value object `Password`, port `PasswordHasher`,
adapter **argon2**) existe dans le contexte `user`, **testée mais non exposée**
(pas de route d'inscription). Conservée comme démonstration ; le chemin de
connexion actif est **Google uniquement**.

### À venir

- Protéger les routes des autres contextes avec `JwtAuthGuard`.
- Avec le contexte `health-document` : ajouter le scope **`drive.file`**, l'accès
  *offline*, et le **stockage chiffré du refresh token** (accès Google Drive).
