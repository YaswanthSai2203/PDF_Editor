<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Project overview

NimbusPDF is a PDF editor SaaS (early Phase 1). The only runnable service is the Next.js web app in `apps/web`. No database, Docker, or external services are needed. See `README.md` and `apps/web/README.md` for standard commands (`npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build`).

### SSR polyfill for pdfjs-dist

`pdfjs-dist` references browser-only `DOMMatrix` during module evaluation, which crashes Next.js SSR. The file `apps/web/instrumentation.ts` provides a minimal polyfill via the Next.js instrumentation hook. Do not remove it — the dev server (and production SSR) will 500 on every page without it.

### Running the dev server

Run `npm run dev` from the workspace root (delegates to `apps/web`). The viewer is at `http://localhost:3000/viewer`. The root `/` redirects there.

### Lint & typecheck scope

The lint script covers `app src scripts next.config.ts eslint.config.mjs` with `--max-warnings=0`. TypeScript strict mode is enabled.
