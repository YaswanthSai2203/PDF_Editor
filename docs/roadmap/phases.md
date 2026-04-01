# Phased Build Plan (Production-Minded)

Each phase includes: goals, technical decisions, file structure, code slice, and next steps.

## Phase 1: Project architecture and folder structure

- **Goals**
  - Establish clean architecture boundaries and feature modules.
  - Ship shell layout + first viewer route.
- **Technical decisions**
  - App Router with a shared app shell.
  - Feature module `pdf-viewer` with isolated service adapter.
- **File structure**
  - `apps/web/src/core/*`
  - `apps/web/src/features/pdf-viewer/*`
  - `apps/web/src/components/layout/*`
- **Code**
  - Initial shell layout and PDF viewer implemented.
- **Next steps**
  - Add Prisma schema and DB client wiring.

## Phase 2: Database schema and entities

- **Goals**
  - Define typed relational model with tenant boundaries.
- **Technical decisions**
  - PostgreSQL + Prisma migrations.
  - UUID-like CUID IDs and immutable version records.
- **File structure**
  - `apps/web/prisma/schema.prisma`
  - `apps/web/src/core/domain/*`
- **Code**
  - Prisma schema and domain contracts.
- **Next steps**
  - Add repository adapters per feature.

## Phase 3: App layout and navigation

- **Goals**
  - Global nav, workspace switcher, document context.
- **Technical decisions**
  - Route group for authenticated app shell.
- **Next steps**
  - Command palette and recent docs list.

## Phase 4: PDF viewer

- **Goals**
  - Smooth rendering for large documents.
- **Technical decisions**
  - PDF.js worker, page virtualization, zoom state.
- **Next steps**
  - Thumbnail rail and text layer toggles.

## Phase 5: Annotation engine

- **Goals**
  - Typed annotation model with conflict-safe persistence.
- **Technical decisions**
  - Layered canvas + normalized annotation DTOs.
- **Next steps**
  - Undo/redo and optimistic sync.

## Phase 6: Text/image editing

- **Goals**
  - Overlay editor with transform handles.
- **Technical decisions**
  - Keep original PDF immutable; save edits as operation graph.
- **Next steps**
  - Flatten export pipeline.

## Phase 7: Page organizer

- **Goals**
  - Reorder, rotate, duplicate, extract, merge.
- **Technical decisions**
  - Persist page operations as versioned command list.
- **Next steps**
  - Batch operations and keyboard shortcuts.

## Phase 8: Signature workflow

- **Goals**
  - Request, track, and complete signatures.
- **Technical decisions**
  - Native signature + optional provider adapter.
- **Next steps**
  - Reminder and webhook events.

## Phase 9: Forms builder/filler

- **Goals**
  - Build and fill robust form fields.
- **Technical decisions**
  - Schema-driven field definitions with validation.
- **Next steps**
  - Calculation fields and conditional logic.

## Phase 10: OCR pipeline

- **Goals**
  - Searchable text from scanned pages.
- **Technical decisions**
  - Async job pipeline and per-page OCR confidence.
- **Next steps**
  - Manual correction UI for low-confidence areas.

## Phase 11: Collaboration and versioning

- **Goals**
  - Comments, mentions, presence, and restore points.
- **Technical decisions**
  - Event sourcing for timeline; snapshots for fast restore.
- **Next steps**
  - Realtime cursors/selection awareness.

## Phase 12: AI assistant

- **Goals**
  - Summarize, extract, redraft, and suggest edits.
- **Technical decisions**
  - Tool-calling architecture with policy guardrails.
- **Next steps**
  - Prompt templates and enterprise controls.

## Phase 13: Billing/admin/team features

- **Goals**
  - Entitlements, seats, admin controls.
- **Technical decisions**
  - Stripe + server-side entitlement checks.
- **Next steps**
  - Usage metering dashboards.

## Phase 14: Testing and deployment

- **Goals**
  - Ship confidence with CI/CD and observability.
- **Technical decisions**
  - Unit + integration + e2e; staged rollouts.
- **Next steps**
  - Chaos/failover tests for worker pipelines.
