# NimbusPDF Web App

Next.js frontend and BFF surface for a premium PDF editor SaaS.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui-style primitives
- PDF.js (`pdfjs-dist`)
- Prisma (PostgreSQL)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/viewer`.

### Database (required for saved edits, OCR, forms, signatures, etc.)

The app uses PostgreSQL via Prisma. Default connection (override with `DATABASE_URL`):

`postgresql://postgres:postgres@localhost:5432/pdf_editor`

```bash
# from apps/web
npx prisma migrate deploy
```

After Postgres is running and migrations are applied, opening the viewer **without** `docId` will auto-create a workspace document and add `docId` to the URL so API-backed features work.

In **production**, the auto-bootstrap endpoint is off unless you set `ALLOW_DEV_WORKSPACE_BOOTSTRAP=true` (use real document provisioning instead).

## Available scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Structure

```text
app/                          # Next.js routes (App Router)
src/components/               # shared UI/layout components
src/core/                     # domain entities + service contracts
src/features/pdf-viewer/      # viewer module implementation
prisma/schema.prisma          # database schema
scripts/copy-pdf-worker.mjs   # ensures PDF.js worker in /public
```
