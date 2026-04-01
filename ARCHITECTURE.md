# PDF Editor SaaS — Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js App Router (React 18)                  │   │
│  │                                                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │  PDF Viewer      │  │  Annotation      │  │  Page           │  │   │
│  │  │  (PDF.js)        │  │  Engine          │  │  Organizer      │  │   │
│  │  │  Canvas layer    │  │  (Konva/Canvas)  │  │  (DnD Kit)      │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  │                                                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │  Signature       │  │  Form Builder    │  │  AI Assistant   │  │   │
│  │  │  Workflow        │  │  (React Hook     │  │  (OpenAI/       │  │   │
│  │  │  (Konva sig pad) │  │   Form + Zod)    │  │   Streaming)    │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  │                                                                    │   │
│  │  State: Zustand stores  │  UI: shadcn/ui + Tailwind              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          HTTPS / WebSocket
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER (Next.js API Routes)                       │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Auth Service │  │ PDF Service  │  │ OCR Service  │  │ AI Service │  │
│  │  (NextAuth)  │  │ (pdf-lib /   │  │ (Tesseract / │  │ (OpenAI    │  │
│  │              │  │  Ghostscript)│  │  AWS Textract)│  │  GPT-4)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Storage Svc  │  │ Collab Svc   │  │ Billing Svc  │  │ Email Svc  │  │
│  │ (S3/R2)      │  │ (WebSocket + │  │ (Stripe)     │  │ (Resend)   │  │
│  │              │  │  Yjs CRDT)   │  │              │  │            │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                  │
│                                                                          │
│   PostgreSQL (Prisma ORM)     │  Redis (cache + pub/sub + rate limit)   │
│   ┌────────────────────────┐  │  ┌─────────────────────────────────┐   │
│   │ Users / Teams / Orgs   │  │  │  Session cache                  │   │
│   │ Documents / Versions   │  │  │  Real-time annotation updates   │   │
│   │ Annotations            │  │  │  Rate limiting counters         │   │
│   │ Signatures             │  │  └─────────────────────────────────┘   │
│   │ Form Definitions       │  │                                         │
│   │ Audit Logs             │  │  Object Storage (S3-compatible / R2)    │
│   │ Subscriptions          │  │  ┌─────────────────────────────────┐   │
│   └────────────────────────┘  │  │  Raw PDF files                  │   │
│                                │  │  Processed PDF versions          │   │
│                                │  │  Exported documents              │   │
│                                │  │  Signature images                │   │
│                                │  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Feature Breakdown

### MVP (Free Tier)
- Upload and view PDFs (unlimited views, 5 docs stored)
- Highlight, underline, strikethrough annotations
- Add text comments / sticky notes
- Simple electronic signature (draw, type, upload)
- Download annotated PDF
- Basic form filling (AcroForm fields)
- Single user only

### Pro ($19/month per seat)
- Unlimited document storage
- Full annotation suite (shapes, freehand draw, stamps)
- Text editing (add/edit text layers)
- Image insertion
- Page organizer (reorder, rotate, delete, merge, split)
- OCR on scanned PDFs (text extraction and search)
- Advanced signature workflow (request signatures from others)
- Document password protection / encryption
- Version history (30 days)
- Export to Word / Excel / image formats
- Audit trail

### Enterprise ($49/month per seat, min 10 seats)
- Everything in Pro
- Real-time collaboration (multi-user editing with CRDTs)
- AI assistant (summarize, search, extract data, rewrite)
- Custom form builder (create fillable PDFs)
- SSO / SAML integration
- Custom branding / white-label
- Compliance exports (GDPR, SOC2 audit logs)
- API access with webhooks
- Custom retention policies
- Dedicated support SLA

## Technical Stack Decisions

| Concern              | Choice                  | Rationale                                               |
|----------------------|-------------------------|---------------------------------------------------------|
| Framework            | Next.js 15 App Router   | SSR, RSC, API routes, edge-ready                        |
| Language             | TypeScript strict mode  | Full type safety across client/server                   |
| Styling              | Tailwind CSS + shadcn   | Utility-first, accessible components, easy theming      |
| PDF Rendering        | PDF.js (Mozilla)        | Gold standard, runs in browser, no server round-trips   |
| PDF Manipulation     | pdf-lib                 | Pure TS, no native deps, good for annotations/merging   |
| Canvas / Annotations | Konva.js                | Layered canvas, hit detection, serializable state       |
| State Management     | Zustand                 | Minimal boilerplate, slice-able, DevTools support       |
| Database             | PostgreSQL + Prisma      | Relational, migrations, type-safe queries               |
| File Storage         | S3 / Cloudflare R2      | Scalable, pre-signed uploads, CDN-friendly              |
| Auth                 | NextAuth v5             | Flexible providers, adapter-based, session management   |
| Real-time            | WebSockets + Yjs        | Conflict-free CRDT for collab, proven in Notion/Figma   |
| OCR                  | AWS Textract / Tesseract| Textract for accuracy, Tesseract for self-hosted option |
| AI                   | OpenAI GPT-4 + embeddings| Streaming, function calling, vector search for docs    |
| Billing              | Stripe                  | Industry standard, webhook-based, metered billing       |
| Email                | Resend                  | Developer-first, React Email templates                  |
| Cache / Queue        | Upstash Redis           | Serverless-compatible, rate limiting, pub/sub           |

## Folder Structure

```
/workspace
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Auto-generated migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, signup, reset)
│   │   ├── (dashboard)/       # Authenticated app shell
│   │   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   │   ├── page.tsx       # Document list home
│   │   │   ├── editor/[id]/   # PDF editor for a document
│   │   │   ├── organizer/[id]/# Page organizer
│   │   │   ├── signatures/    # Signature requests
│   │   │   ├── forms/         # Form builder
│   │   │   ├── team/          # Team management
│   │   │   └── billing/       # Subscription management
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── documents/     # CRUD + upload
│   │   │   ├── annotations/   # Annotation CRUD
│   │   │   ├── signatures/    # Signature workflow
│   │   │   ├── ocr/           # OCR trigger
│   │   │   ├── ai/            # AI assistant
│   │   │   ├── billing/       # Stripe webhooks
│   │   │   └── export/        # PDF export
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── layout/            # Shell, Sidebar, Header
│   │   ├── pdf/               # PDFViewer, PageRenderer, Thumbnail
│   │   ├── annotations/       # AnnotationLayer, tools per type
│   │   ├── toolbar/           # EditorToolbar, ToolButton
│   │   ├── sidebar/           # PanelThumbnails, PanelAnnotations
│   │   ├── signature/         # SignaturePad, SignatureModal
│   │   ├── forms/             # FormField, FormCanvas
│   │   └── shared/            # Confirm dialogs, upload zone, etc.
│   │
│   ├── lib/                   # Pure business logic / service abstractions
│   │   ├── pdf/               # PDFService, exporters
│   │   ├── annotations/       # AnnotationSerializer
│   │   ├── storage/           # StorageService (S3/R2 abstraction)
│   │   ├── ocr/               # OCRService
│   │   ├── ai/                # AIService
│   │   ├── auth/              # Session helpers
│   │   ├── billing/           # StripeService
│   │   └── collaboration/     # YjsProvider
│   │
│   ├── features/              # Feature-scoped logic
│   │   ├── editor/            # useEditor hook, editor store slice
│   │   ├── organizer/         # useOrganizer hook
│   │   ├── forms/             # Form builder state
│   │   ├── signatures/        # Signature request flow
│   │   ├── ocr/               # OCR trigger + result state
│   │   ├── collaboration/     # Presence, cursor sharing
│   │   ├── ai/                # Chat state, embeddings
│   │   └── billing/           # Plan gates, usage checks
│   │
│   ├── hooks/                 # Shared React hooks
│   │   ├── use-pdf.ts
│   │   ├── use-annotations.ts
│   │   ├── use-keyboard.ts
│   │   └── use-upload.ts
│   │
│   ├── stores/                # Zustand store definitions
│   │   ├── document.store.ts
│   │   ├── annotation.store.ts
│   │   ├── ui.store.ts
│   │   └── user.store.ts
│   │
│   ├── types/                 # Shared TypeScript types
│   │   ├── document.ts
│   │   ├── annotation.ts
│   │   ├── signature.ts
│   │   ├── form.ts
│   │   └── api.ts
│   │
│   ├── server/                # Server-only code
│   │   ├── services/          # Server-side service implementations
│   │   └── repositories/      # Data access layer
│   │
│   └── db/                    # Prisma client singleton
│       └── index.ts
│
├── public/
│   └── pdf.worker.min.mjs     # PDF.js worker (copied from node_modules)
├── .env.example
└── ARCHITECTURE.md
```
