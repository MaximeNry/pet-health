---
name: verify
description: How to run and drive the PetHealth app end-to-end for verification (dev auth bypass, headless browser, gotchas).
---

# Verifying PetHealth changes at runtime

## Stack up

`docker compose up -d` from the repo root. Services: web on :3001, api on
:3000, postgres on :5432 (user/db `pethealth`). `apps/web/src`,
`apps/web/messages` and `apps/api/src` are bind-mounted → hot reload; anything
else (deps, config) needs `docker compose up -d --build <service>`.

## Authenticated session without Google OAuth

The API guards everything behind an `access_token` httpOnly cookie holding an
HS256 JWT (`JWT_SECRET`, defaults to `dev-secret-change-me` in compose).
Forge one — payload `{ sub: <userId>, email, iat, exp }`:

```bash
python3 - <<'EOF'
import hmac, hashlib, base64, json, time
b64 = lambda d: base64.urlsafe_b64encode(d).rstrip(b'=')
h = b64(json.dumps({"alg":"HS256","typ":"JWT"}).encode())
now = int(time.time())
p = b64(json.dumps({"sub":"<USER_ID>","email":"<EMAIL>","iat":now,"exp":now+86400}).encode())
s = b64(hmac.new(b'dev-secret-change-me', h+b'.'+p, hashlib.sha256).digest())
print((h+b'.'+p+b'.'+s).decode())
EOF
```

Find users/pets: `docker exec pethealth-postgres-1 psql -U pethealth -d
pethealth -c "SELECT id,email FROM users;"` (tables are snake_case:
`users`, `pets`, `households`, `household_members`, `health_documents`).
Seeded users like `alice@example.com` exist; prefer creating throwaway rows
over mutating existing ones (a Puppeteer triple-click+type on prefilled
inputs *appends* instead of replacing — restore via `PATCH /pets/:id` if it
happens).

## Driving the UI

No Playwright in the repo. Install `puppeteer-core` in the scratchpad and use
local Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`),
`headless: 'new'`, and set the cookie on `localhost` (the browser sends it to
both :3001 and the API on :3000):

```js
await browser.setCookie({ name: 'access_token', value: TOKEN,
  domain: 'localhost', path: '/', httpOnly: true });
```

Gotchas:
- `button[aria-haspopup="menu"]` also matches the header AccountMenu; the
  pet-detail kebab is `button[aria-haspopup="menu"][aria-label]`.
- Log `console` type `error` and `pageerror` — missing next-intl keys only
  surface there (`IntlError: MISSING_MESSAGE`), the UI renders the raw key.
- Wait ~1s after mutations for TanStack Query invalidation before asserting.

## Flows worth driving

Login guard (no cookie → redirect `/login`), dashboard cards → detail page
(`/pets/:id`), tabs, kebab → edit modal (saves + header refresh), kebab →
delete dialog (redirects to `/`), unknown pet id → error state.
