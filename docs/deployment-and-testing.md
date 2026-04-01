# Testing and Deployment Runbook

This document defines the Phase 14 quality and release baseline for the PDF editor.

## 1) Local verification checklist

Run from workspace root:

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run typecheck
npm --prefix apps/web run test
npm --prefix apps/web run build
```

Expected:
- Lint exits with no warnings.
- TypeScript passes in strict mode.
- Vitest suite passes and emits coverage.
- Production build succeeds.

## 2) CI pipeline

CI is defined in:

- `.github/workflows/ci.yml`

On push and pull requests to `main` and `cursor/**`, it runs:
1. install dependencies (`npm ci` in `apps/web`)
2. lint
3. typecheck
4. tests with coverage
5. production build

## 3) Environment variables

Required runtime variable:

- `DATABASE_URL`: PostgreSQL connection string

Notes:
- `src/lib/prisma.ts` includes a local fallback URL for dev.
- Production should always set `DATABASE_URL` explicitly.

## 4) Deployment targets

The app is a standard Next.js App Router deployment and can run on:
- Vercel
- Containerized Node hosting (AWS/GCP/Azure/Render/Fly)

### Minimal container/startup sequence

1. `npm ci --prefix apps/web`
2. `npm --prefix apps/web run build`
3. `npm --prefix apps/web run start`

## 5) Database and schema operations

For schema updates (Prisma):

```bash
npx prisma migrate deploy
```

For local development:

```bash
npx prisma migrate dev
```

## 6) Smoke tests after deploy

Manually verify:
- `/viewer` loads and renders a PDF
- Admin panel opens from toolbar
- Membership create/update roundtrip via API
- Subscription create/update roundtrip via API
- Entitlement upsert and refresh flow

## 7) Rollback strategy

- Roll back to prior release artifact/image.
- If needed, roll back schema only when migration is backward-compatible.
- Keep a database backup snapshot before production migration.
