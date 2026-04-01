# PDF Editor SaaS Build Phases

## Phase 1: Project architecture and folder structure
- Goals
  - Establish the single-app structure, feature boundaries, and service abstractions.
  - Define the editor workspace shell and initial viewer route.
- Technical decisions
  - Start with a single Next.js app using feature modules.
  - Keep domain/application/infrastructure layers explicit inside complex features.
  - Introduce typed service contracts early so later OCR/signature/storage providers remain swappable.
- File structure
  - `src/app`
  - `src/features`
  - `src/services`
  - `src/components/ui`
  - `src/lib`
  - `docs`
  - `prisma`
- Code
  - Implemented in this change set.
- Next steps
  - Add auth, persistence wiring, and background job adapters.

## Phase 2: Database schema and entities
- Goals
  - Model organizations, billing, documents, edits, signatures, OCR jobs, collaboration, and AI usage.
- Technical decisions
  - Prisma for type-safe queries and migrations.
  - Postgres as system of record; object storage holds binaries.
- File structure
  - `prisma/schema.prisma`
  - `src/lib/db`
  - `src/features/*/domain`
- Code
  - Initial schema is included now; repositories come in the next slice.
- Next steps
  - Add migration files and repository implementations.

## Phase 3: App layout and navigation
- Goals
  - Build the cross-product shell, left navigation, top workspace bar, and context panels.
- Technical decisions
  - Server-render the shell and use client islands for interactive panes.
- File structure
  - `src/app/(workspace)`
  - `src/features/workspace`
- Code
  - Initial shell implemented now.
- Next steps
  - Add auth-aware organization switching and recent document lists.

## Phase 4: PDF viewer
- Goals
  - Render PDFs reliably with zoom, page navigation, thumbnails, and progressive loading.
- Technical decisions
  - PDF.js via a typed adapter.
  - Worker path configured explicitly to avoid runtime ambiguity.
- File structure
  - `src/features/pdf-viewer`
  - `src/services/pdf`
- Code
  - Initial viewer page and adapter implemented now.
- Next steps
  - Add virtualization, text layer, and search indexing.

## Phase 5: Annotation engine
- Goals
  - Add highlights, comments, drawings, shapes, and shared review flows.
- Technical decisions
  - Persist annotations as normalized entities plus a document event stream.
- Next steps
  - Introduce canvas overlay and conflict-safe operations.

## Phase 6: Text/image editing
- Goals
  - Support text replacement, image replacement, and object transforms.
- Technical decisions
  - Editing service abstraction hides provider-specific PDF mutation engines.
- Next steps
  - Add edit sessions, font management, and page object indexing.

## Phase 7: Page organizer
- Goals
  - Reorder, rotate, duplicate, insert, delete, and merge pages.
- Technical decisions
  - Use immutable document revisions with background binary generation.
- Next steps
  - Build drag-and-drop thumbnail grid and bulk operations.

## Phase 8: Signature workflow
- Goals
  - Create signatures, signature requests, fields, and audit trails.
- Technical decisions
  - Dedicated signature provider abstraction and event-backed audit log.
- Next steps
  - Add signer identity verification and webhooks.

## Phase 9: Forms builder/filler
- Goals
  - Add form field authoring, data binding, validation, and submission packages.
- Technical decisions
  - Store form definitions separately from final PDF appearance streams.
- Next steps
  - Add reusable templates and bulk fill APIs.

## Phase 10: OCR pipeline
- Goals
  - Convert scanned PDFs into searchable, editable assets.
- Technical decisions
  - Async OCR jobs with provider abstraction and extracted text chunks.
- Next steps
  - Add confidence heatmaps and retry/cost controls.

## Phase 11: Collaboration and versioning
- Goals
  - Real-time comments, presence, review status, diffs, and document history.
- Technical decisions
  - Event-sourced revision model plus presence transport.
- Next steps
  - Add branching/restore flows and granular permissions.

## Phase 12: AI assistant
- Goals
  - Summarize documents, answer questions, propose redactions, and automate workflows.
- Technical decisions
  - Retrieval over OCR/text extracts and explicit tool/service boundaries.
- Next steps
  - Add prompt safety, budget controls, and action approvals.

## Phase 13: Billing/admin/team features
- Goals
  - Plans, seats, roles, usage metering, admin controls, and audit dashboards.
- Technical decisions
  - Separate billing aggregates from document collaboration entities.
- Next steps
  - Add entitlements middleware and admin reporting.

## Phase 14: Testing and deployment
- Goals
  - Production-grade CI, observability, quality gates, and deploy strategy.
- Technical decisions
  - Layered testing: unit, integration, visual, and E2E.
- Next steps
  - Add Playwright, Sentry, OpenTelemetry, worker deployment, and IaC.
