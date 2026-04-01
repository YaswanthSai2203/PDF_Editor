# DocFlow — Premium PDF Editor SaaS

A production-ready PDF editor comparable to Adobe Acrobat, built with Next.js 16, TypeScript, Tailwind CSS, and PDF.js.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design document.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router (Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| PDF Rendering | PDF.js (Mozilla) |
| Canvas/Annotations | SVG + Canvas API (Konva-ready) |
| State | Zustand with devtools + persist |
| Database | PostgreSQL via Prisma 7 ORM |
| Auth | NextAuth v5 (pluggable providers) |
| Storage | S3 / Cloudflare R2 |
| Billing | Stripe |
| Email | Resend |
| AI | OpenAI GPT-4 |
| OCR | AWS Textract / Tesseract |
| Real-time | WebSockets + Yjs (CRDT) |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Copy `.env.example` to `.env.local` and fill in required values

### Installation

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and other secrets

# Generate Prisma client
npx prisma generate

# Run database migrations (requires a running DB)
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Authenticated app shell
│   │   ├── layout.tsx        # Dashboard layout (sidebar + header)
│   │   ├── page.tsx          # Home dashboard
│   │   ├── documents/        # Document list
│   │   └── editor/[id]/      # PDF editor
│   └── api/                  # API routes (to be expanded)
├── components/
│   ├── ui/                   # shadcn/ui base components
│   ├── layout/               # AppSidebar, AppHeader
│   ├── pdf/                  # PDFViewer, PDFPage, PDFThumbnail
│   ├── annotations/          # AnnotationLayer, AnnotationRenderer
│   ├── toolbar/              # EditorToolbar
│   └── sidebar/              # PanelThumbnails, PanelAnnotations
├── hooks/                    # use-pdf, use-annotations
├── stores/                   # Zustand: document, annotation, ui
├── types/                    # document, annotation, signature, api
├── lib/                      # Service abstractions
│   └── pdf/                  # PDFService (PDF.js wrapper)
└── db/                       # Prisma client singleton
prisma/
└── schema.prisma             # Full database schema
```

## Feature Roadmap

### Phase 1 — Done ✓
- [x] Architecture design & folder structure
- [x] Database schema (users, teams, documents, annotations, signatures, forms, billing, audit)
- [x] App shell layout (sidebar + header)
- [x] Dashboard home page
- [x] Documents list page
- [x] PDF viewer (PDF.js, continuous scroll, virtualized pages)
- [x] Annotation engine (highlight, underline, strikethrough, shapes, freehand, text)
- [x] Editor toolbar (all tools, zoom, page nav)
- [x] Sidebar panels (thumbnails, annotations)
- [x] Zustand state management

### Phase 2 — Next
- [ ] API routes for document CRUD
- [ ] S3/R2 file upload with presigned URLs
- [ ] NextAuth authentication
- [ ] Annotation persistence (save/load from DB)
- [ ] Comment threads with replies

### Phase 3
- [ ] Page organizer (drag-to-reorder, merge/split PDFs)
- [ ] Signature workflow (request, sign, audit trail)
- [ ] Form builder/filler (AcroForm + custom forms)

### Phase 4
- [ ] OCR pipeline (AWS Textract / Tesseract)
- [ ] Real-time collaboration (Yjs + WebSockets)
- [ ] AI assistant (summarize, search, extract)
- [ ] Billing (Stripe subscriptions + usage gates)
- [ ] Testing (Vitest + Playwright E2E)
- [ ] Deployment (Vercel + Railway/Neon)

## License

MIT
