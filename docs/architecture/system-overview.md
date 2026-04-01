# System Architecture Overview

## 1) High-Level Architecture Diagram (text)

```text
                                   +----------------------+
                                   |   Browser (Next.js)  |
                                   |  App Router + RSC    |
                                   +----------+-----------+
                                              |
                                              | HTTPS / WebSocket
                                              v
+-------------------------+        +----------+-----------+        +----------------------+
| Auth Provider           |<------>|  Next.js BFF Layer   |<------>| Payment Provider     |
| (Clerk/Auth.js/OIDC)    |        |  Route Handlers +    |        | (Stripe)             |
+-------------------------+        |  Server Actions       |        +----------------------+
                                   +----------+-----------+
                                              |
                      +-----------------------+------------------------+
                      |                        |                       |
                      v                        v                       v
            +---------+----------+   +---------+----------+   +--------+---------+
            | Domain Services    |   | Collaboration Svc  |   | AI Orchestrator  |
            | Editing/OCR/Sign   |   | comments/versioning|   | prompts/tools    |
            +---------+----------+   +---------+----------+   +--------+---------+
                      |                        |                       |
                      +-------------+----------+-----------+-----------+
                                    |                      |
                                    v                      v
                         +----------+---------+   +--------+---------+
                         | PostgreSQL + Prisma|   | Object Storage   |
                         | metadata, versions |   | PDFs, snapshots  |
                         +----------+---------+   +--------+---------+
                                    |                      |
                                    +----------+-----------+
                                               |
                                               v
                                      +--------+---------+
                                      | Worker Runtime   |
                                      | OCR, conversion, |
                                      | indexing, async  |
                                      +------------------+
```

## 2) Clean Architecture + Feature Modules

- **Core domain layer**: business entities, typed value objects, service contracts.
- **Application layer**: use-cases/orchestrators (e.g. `ApplyAnnotation`, `RequestSignature`).
- **Infrastructure layer**: Prisma repos, S3 storage adapters, OCR providers, queue workers.
- **Presentation layer**: Next.js App Router UI and API endpoints.

Feature-first organization inside `apps/web/src/features/*`:

- `pdf-viewer`
- `annotation`
- `editor`
- `page-organizer`
- `signature`
- `forms`
- `ocr`
- `collaboration`
- `ai-assistant`
- `billing`

Each feature owns:

- UI components
- hooks/state
- service adapters to core interfaces
- tests

## 3) Monorepo Recommendation

Use a lightweight monorepo layout now to avoid migration pain later:

```text
.
├── apps/
│   └── web/                   # Next.js frontend + BFF endpoints
├── packages/
│   ├── ui/                    # shared shadcn/ui wrappers (later)
│   ├── domain/                # shared entities/contracts (later extraction)
│   ├── config/                # eslint/tsconfig presets (later)
│   └── sdk/                   # typed API clients (later)
└── docs/
```

Current implementation starts in `apps/web` but keeps boundaries explicit so extracting packages is mechanical.

## 4) Technical Decisions and Tradeoffs

1. **Next.js App Router + Server Components**
   - Pros: colocated server/client logic, great DX, caching primitives.
   - Tradeoff: strict async request API model and client/server boundary discipline.

2. **PDF.js for rendering and parsing**
   - Pros: battle-tested renderer, text/annotation APIs, broad browser support.
   - Tradeoff: canvas-based rendering is CPU intensive on large docs; virtualization required at scale.

3. **Prisma + PostgreSQL**
   - Pros: typed schema evolution, relational integrity for audit/version workflows.
   - Tradeoff: some large JSON payload fields must be carefully indexed and partitioned.

4. **Service contracts for editing/OCR/signature/storage**
   - Pros: easy provider swapping (AWS Textract vs GCP Vision, DocuSign vs native).
   - Tradeoff: initial abstraction cost, but lower long-term coupling.

5. **Object storage for binary PDFs**
   - Pros: cheap durable blob storage; DB stores metadata only.
   - Tradeoff: requires pre-signed URL strategy and background ingestion pipeline.
