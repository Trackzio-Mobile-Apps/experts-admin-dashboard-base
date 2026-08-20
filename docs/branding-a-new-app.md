# Branding a new product from this codebase

This admin is **white-label**. One Git repository, one app. Each product is a separate deploy with its own env vars. A running site always talks to **one** API.

Do **not** add apps from Settings or switch products in the sidebar. That was removed on purpose so operators cannot mix backends in one browser session.

## What changes per product

| What | Env var | Example |
| --- | --- | --- |
| Brand name | `APP_NAME` | `Banknote` |
| Logo letter (1–2 chars) | `APP_ICON` | `B` |
| Primary color (hex) | `APP_COLOR` | `#1d4ed8` |
| Experts API base URL | `API_BASE_URL` | `https://banknote-experts-api.example.com` |

Optional:

| What | Env var | Default |
| --- | --- | --- |
| Stable id (storage, Excel filenames) | `APP_ID` | slug of the name (`banknote`) |
| Sidebar color | `APP_SIDEBAR` | slightly darker than primary |
| Labels under the sidebar logo | `APP_MODELS` | empty (Coinzy keeps `Coin evaluation`) |

Public values are baked in at **build** time. After changing them in Netlify, trigger a new deploy.

## Local: run another product on your machine

1. Copy `.env.sample` to `.env.local` (or a second file you load yourself).
2. Set the four required vars, for example:

```bash
APP_NAME=Banknote
APP_ICON=B
APP_COLOR=#1d4ed8
API_BASE_URL=https://banknote-experts-api.example.com
```

3. Restart `npm run dev`. The login heading, sidebar, and API calls now use Banknote.

Coinzy is the default when those vars are omitted.

## Production: new Netlify site (recommended)

Use a **new Netlify site** from the **same GitHub repo**. Same `main` branch is fine. Site-level env vars keep products isolated.

1. Netlify → Add new site → Import the same repository.
2. Build command: `npm run build` (already in `netlify.toml`). Publish directory: `dist`.
3. Site settings → Environment variables, set at least:

```text
APP_NAME=Banknote
APP_ICON=B
APP_COLOR=#1d4ed8
API_BASE_URL=https://banknote-experts-api.example.com
APP_ID=banknote
```

4. Also set that product’s Firebase keys. Optional: `REPORT_RECIPIENT_EMAIL` as the default inbox on Reports. See `.env.production.sample`.
5. Deploy. Give the site its own domain (e.g. `banknote-admin.example.com`).

Coinzy’s existing site keeps its own env vars. The two sites do not share session keys.

## Alternative: Netlify branch deploy

If you prefer one Netlify site and a Git branch per product:

1. Create a long-lived branch, e.g. `app/banknote`.
2. In Netlify, enable branch deploys for that branch (or set it as a branch subdomain).
3. Scope the Banknote env vars to **that branch only**. Keep Coinzy vars on `main` / production.

Code on `app/banknote` can stay identical to `main`. Only the env scope must differ. If you cherry-pick features, merge `main` into the product branch regularly so you do not fork the codebase.

Set `APP_ID` explicitly when the branch name should not become the app id.

## What you should not change

For a new product you should **not** need to fork pages, duplicate components, or add an in-app app switcher.

Code reads branding from `getAdminApp()` in `src/lib/apps.ts`. UI (login, sidebar, theme) and reports (email subject, Excel filename, session storage) follow that config.

CSS token names (`--brand-primary`) are internal. `applyAppTheme()` overwrites them from `APP_COLOR` at runtime.

## Checklist for a new product

- [ ] Backend admin API is up and accepts `x-admin-key`
- [ ] Four brand env vars set (name, icon, color, API URL)
- [ ] Firebase web app config set if profile image upload is needed
- [ ] New Netlify site or branch-scoped env, then a fresh deploy
- [ ] Sign in on `/login` with that product’s admin key
- [ ] Confirm the sidebar color/icon and that experts load from the new API
