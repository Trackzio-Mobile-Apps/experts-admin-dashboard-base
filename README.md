# Experts Admin

White-label admin portal for Trackzio expert products.

This is **one codebase**. Each product (Coinzy, Banknote, and anything after that) is a **separate deploy** of the same app. The only things that change per product are:

- API URL
- Brand name
- Icon letter
- Color

Do not add a second app inside the running UI. Point a new Netlify site (or branch) at this repo and set `APP_*`, `API_BASE_URL`, and `FIREBASE_*`.

**How to brand a new product:** [docs/branding-a-new-app.md](docs/branding-a-new-app.md)

## Local

```bash
cp .env.sample .env.local
# fill Firebase + API URL, then:
npm install
npm run dev
```

Operators enter the admin API key on `/login`. Do not commit secrets.

## Deploy on Netlify

Build settings are already in `netlify.toml` (`npm run build`, publish `dist`, Node 20).

```bash
npm install -g netlify-cli
netlify login
git push -u origin HEAD
netlify init
# if the site already exists:
netlify link
netlify deploy --prod
```

In Netlify → Site configuration → Environment variables, set at least `APP_NAME`, `APP_ICON`, `APP_COLOR`, `API_BASE_URL`, and the `FIREBASE_*` keys. Full list: `.env.production.sample`. After changing public env vars, trigger a new deploy so they bake into the build.
