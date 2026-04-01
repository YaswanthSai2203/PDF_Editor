# Database Schema (PostgreSQL + Prisma)

## Design Principles

- Multi-tenant by `organizationId` for all business records.
- Metadata in relational tables, binaries in object storage.
- Immutable version snapshots for auditability.
- Event log for collaboration and AI assistant traceability.

## Core Entities

- **User / Organization / Membership**: identity and RBAC.
- **Document**: logical PDF asset.
- **DocumentVersion**: immutable artifact and diff context.
- **PageArtifact**: per-page metadata for organizer/editor pipelines.
- **Annotation**: normalized annotation records.
- **SignatureRequest / SignatureRecipient / SignatureField**.
- **FormField** + submitted values.
- **OcrJob / OcrResult**.
- **Comment / ActivityEvent** for collaboration timeline.
- **Subscription / Entitlement** for plan gating.
