# PDF Editor SaaS Architecture

## Phase 1 goals

- Establish a production-minded application foundation using Next.js, TypeScript, Tailwind CSS, and shadcn/ui-compatible primitives.
- Define clean boundaries for PDF rendering, document editing, OCR, signatures, and storage before adding editing features.
- Deliver an immediately usable shell layout and initial PDF viewer page that can evolve into a full editor workspace.

## High-level architecture diagram

```text
+----------------------------------------------------------------------------------+
|                                Web / API Surface                                |
|----------------------------------------------------------------------------------|
| Next.js App Router                                                               |
|  - Marketing + auth flows                                                        |
|  - Workspace shell                                                               |
|  - Document viewer/editor routes                                                 |
|  - Route handlers / server actions / webhooks                                    |
+------------------------------------------+---------------------------------------+
                                           |
                                           v
+----------------------------------------------------------------------------------+
|                             Application / Use Cases                              |
|----------------------------------------------------------------------------------|
| Feature modules                                                                   |
|  - documents        - pdf-viewer      - annotations     - page-organizer         |
|  - editor           - forms           - signatures      - ocr                    |
|  - collaboration    - billing         - admin           - ai-assistant           |
|                                                                                  |
| Each module contains:                                                             |
|  - domain entities/value objects                                                  |
|  - application use-cases                                                          |
|  - presentation adapters                                                          |
|  - infrastructure implementations                                                 |
+------------------------------------------+---------------------------------------+
                                           |
                                           v
+----------------------------------------------------------------------------------+
|                                Platform Services                                 |
|----------------------------------------------------------------------------------|
| Service contracts                                                                 |
|  - PdfRenderingService                                                            |
|  - DocumentEditingService                                                         |
|  - OcrService                                                                     |
|  - SignatureService                                                               |
|  - StorageService                                                                 |
|                                                                                  |
| Example implementations                                                           |
|  - PDF.js viewer adapter                                                          |
|  - server-side PDF mutation worker                                                |
|  - OCR worker pipeline                                                            |
|  - signature certificate provider                                                 |
|  - S3/R2/blob storage adapters                                                    |
+------------------------------------------+---------------------------------------+
                                           |
                                           v
+----------------------------------------------------------------------------------+
|                                Data / Integration                                |
|----------------------------------------------------------------------------------|
| PostgreSQL + Prisma                                                               |
| Redis / queue                                                                      |
| Object storage                                                                    |
| Realtime collaboration bus                                                        |
| Audit/event store                                                                  |
| External services: OCR, payments, email, LLM, e-sign compliance                  |
+----------------------------------------------------------------------------------+
```

## Product packaging

### MVP

- Authentication, workspaces, and document library
- PDF upload/download
- Fast viewer with thumbnails, zoom, rotation, search, and basic metadata
- Annotations: highlight, note, freehand, text box, shapes
- Basic page operations: reorder, rotate, delete, duplicate
- Signature insertion with saved signatures
- Simple form filling
- Version history snapshots

### Pro

- Direct text/image editing with server-side PDF mutation pipeline
- OCR for scanned PDFs with selectable text layer
- Advanced forms builder
- Shared comments and document review workflows
- Template library, branding, and advanced exports
- AI assistant for summarize/extract/redact suggestions
- Usage analytics and billing controls

### Enterprise

- SSO, SCIM, granular RBAC, legal hold, audit exports
- Advanced approval workflows and team administration
- Realtime multiplayer collaboration with conflict resolution
- Region-aware storage and compliance controls
- Dedicated OCR/signing providers and bring-your-own-key options
- Private AI deployment / policy controls

## Recommended repo structure

For this stage, use a **single Next.js application with internal modular boundaries**, not a monorepo.

Why:

- The first 6-8 milestones are tightly coupled around one web product and one database.
- Shared code can still be isolated under `src/features` and `src/services`.
- It avoids early operational overhead from workspaces, package publishing, and duplicated tooling.

When to evolve to a monorepo:

- Native desktop/mobile clients are introduced.
- Dedicated worker services for OCR, document mutation, and realtime collaboration need separate deployment cadences.
- Shared SDKs or design system packages must be versioned independently.

## Folder structure

```text
src/
  app/
    (workspace)/
      viewer/
        page.tsx
      layout.tsx
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/
      button.tsx
      card.tsx
      badge.tsx
      separator.tsx
  features/
    pdf-viewer/
      application/
      domain/
      infrastructure/pdfjs/
      presentation/
    workspace/
      config/
      presentation/
  services/
    editing/
    ocr/
    pdf/
    signatures/
    storage/
  lib/
    cn.ts
prisma/
  schema.prisma
docs/
  architecture.md
```

## Technical decisions and tradeoffs

### App architecture

- **Next.js App Router** for server-rendered app shell, route-level code splitting, and future server actions.
- **Feature-first source tree** to keep viewer/editor/collaboration logic cohesive.
- **Service abstractions** separate contracts from concrete providers so later OCR/signing/storage changes do not leak into features.

Tradeoff:
- Slightly more upfront ceremony than colocating everything in page components, but it keeps later phases manageable.

### UI system

- **Tailwind CSS** for fast product iteration.
- **shadcn/ui-compatible primitives** for consistency without locking into a black-box component library.
- **Radix Slot + CVA** to keep low-level components typed and composable.

Tradeoff:
- More ownership over component maintenance, but much better control for a premium SaaS product.

### PDF rendering

- **PDF.js** for page rendering and text extraction in the browser.
- Adapter sits behind a `PdfRenderingService` contract.

Tradeoff:
- Browser rendering is excellent for viewing and overlays, but direct PDF mutation still needs a separate editing pipeline later.

### Data layer

- **PostgreSQL + Prisma** for relational data, team features, and auditable change history.
- Store binary assets in object storage, not in the database.

Tradeoff:
- Versioning and collaboration events increase schema complexity, but this is necessary for enterprise-grade traceability.

## Phase status

- Goals: defined
- Technical decisions: defined
- File structure: defined
- Code delivered in this phase: shell layout, navigation, PDF viewer foundation, schema, and service contracts
- Next steps: annotation engine with overlay state, persisted comments, and per-page coordinate systems
