# PDF Editor SaaS (Architecture-First Foundation)

Production-minded foundation for a premium PDF editor SaaS built with:

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui-style component primitives
- PDF.js for rendering
- Clean architecture service contracts (editing, OCR, signatures, storage)

## Workspace Layout

```text
.
├── apps/
│   └── web/                  # Next.js product surface
├── docs/
│   ├── architecture/         # System design artifacts
│   ├── product/              # Packaging and plan tiers
│   └── roadmap/              # Incremental implementation phases
└── README.md
```

## Quick Start

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000/viewer`.

## Key Docs

- `docs/architecture/system-overview.md`
- `docs/architecture/database.md`
- `docs/product/feature-tiers.md`
- `docs/roadmap/phases.md`
- `docs/deployment-and-testing.md`
