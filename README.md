# Cinematic Love Story

This repository contains a Vite/React frontend and an Express API in one pnpm workspace. Deploy them as two separate Vercel projects from this repository.

## Vercel Projects

Create both projects from `shantanu2002git/Cinematic-Love-Story`.

### Frontend

- Root Directory: `artifacts/love-story`
- Framework Preset: `Vite`
- Build Command: `pnpm build`
- Output Directory: `dist/public`
- Install Command: leave the default pnpm workspace install (`pnpm install --frozen-lockfile`)
- Environment variable: `VITE_API_URL` = the backend deployment origin, for example `https://your-api-project.vercel.app` (no `/api` suffix)

`VITE_API_URL` is embedded at build time and is not a secret. The frontend appends `/api/story` to this origin. Leave it unset for local development; Vite then proxies `/api` to `http://localhost:3001` as before.

### Backend

- Root Directory: `artifacts/api-server`
- Framework Preset: `Other`
- Runtime: Node.js 22.x
- Build Command: `pnpm run build`
- Output Directory: leave unset; Vercel deploys the function in `api/[...path].ts`
- Install Command: leave the default pnpm workspace install (`pnpm install --frozen-lockfile`)
- Environment variables:
  - `MONGODB_URI` = MongoDB connection string; required by the story read/write routes
  - `CORS_ORIGIN` = exact frontend origin, such as `https://your-frontend-project.vercel.app`; multiple origins can be comma-separated
  - `MONGODB_DB` = optional database name (defaults to `cinematic-love-story`)

The backend exposes `/api/story`, `/api/healthz`, and `/health`. The backend-local Vercel function exports the existing Express app, so Vercel invokes it per request; the local `src/index.ts` listener remains the standalone server entrypoint. `CORS_ORIGIN` controls which browser origins can read API responses. Requests without an `Origin` header remain usable for health checks and server-to-server calls.

## Local Development

Run the frontend from the repository root with:

```powershell
pnpm --filter @workspace/love-story dev
```

The frontend's `/api` requests use the Vite proxy at `http://localhost:3001` when `VITE_API_URL` is unset. The API needs `MONGODB_URI` configured in its environment for story persistence.