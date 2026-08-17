# Experts Admin

White-label admin portal for Trackzio expert products.

This is **one codebase**. Each product (Coinzy, Banknote, and anything after that) is a **separate deploy** of the same app. The only things that change per product are:

- API URL
- Brand name
- Icon letter
- Color

Do not add a second app inside the running UI. Point a new Netlify site (or branch) at this repo and set the env vars.

**How to brand a new product:** [docs/branding-a-new-app.md](docs/branding-a-new-app.md)

## Local

```bash
cp .env.sample .env.local
# fill Firebase + API URL, then:
npm install
npm run dev
```

Operators enter the admin API key on `/login`. Do not commit secrets.
