# Deploying the Updaterw API to Vercel

## Root cause of `FUNCTION_INVOCATION_FAILED`

The function usually crashes on cold start when:

1. Prisma Client was not generated for Linux (`rhel-openssl-3.0.x`)
2. Required env vars are missing in the Vercel project
3. `DATABASE_URL` still points at `127.0.0.1` (localhost is not reachable from Vercel)

## 1. Use a hosted Postgres

Local Postgres will not work from Vercel. Create a free DB on [Neon](https://neon.tech) or [Supabase](https://supabase.com), then run migrations against it:

```bash
cd server
# set DATABASE_URL to the hosted connection string in .env (or export it)
npx prisma migrate deploy
npx prisma db seed
```

Prefer the **pooled** connection string on Neon (often includes `-pooler` and `?sslmode=require`).

## 2. Set Vercel environment variables

In the Vercel project → **Settings → Environment Variables**, add at least:

| Name | Example |
|---|---|
| `DATABASE_URL` | hosted Postgres URL with SSL |
| `JWT_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | long random string |
| `CLIENT_URL` | your frontend URL (`https://….vercel.app` or custom domain) |
| `SERVER_URL` | your API URL (`https://updatesrwtech.vercel.app`) |
| `NODE_ENV` | `production` |

Also copy over Cloudinary / SMTP / OAuth vars if you use those features.

OAuth callback URLs must use the production API host, for example:

- `https://YOUR-API.vercel.app/api/auth/google/callback`
- `https://YOUR-API.vercel.app/api/auth/github/callback`

## 3. Redeploy from the `server` folder

Root Directory in Vercel must be **`server`** (this repo already has `.vercel` linked there).

```bash
cd server
npx vercel --prod
```

## 4. Smoke test

Open:

- `https://YOUR-API.vercel.app/health`
- `https://YOUR-API.vercel.app/api/...`

If `/health` works but DB routes fail, the remaining issue is `DATABASE_URL` / migrations.
