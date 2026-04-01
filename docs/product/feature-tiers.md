# Feature Breakdown: MVP / Pro / Enterprise

## MVP (land and expand)

- Upload, render, and browse PDFs
- Core annotations (highlight, text note, free draw, shapes)
- Basic page operations (reorder, rotate, delete)
- Fill existing form fields
- Download/export updated PDFs
- Individual account + basic billing

## Pro (power users, SMB)

- Text and image editing overlays with snapping/alignment
- Signature workflows (request and sign)
- OCR for scanned PDFs with searchable text layer
- Reusable templates and saved annotation presets
- Version history + restore
- Team workspaces with role-based access

## Enterprise (governance and scale)

- SSO/SAML + SCIM provisioning
- Granular audit trails and legal holds
- Advanced approvals and document policies
- DLP/redaction workflows
- Data residency controls and private networking
- AI assistant with custom policy controls and model routing

## Packaging Notes

- Keep capabilities behind typed feature flags (`entitlements`) in server-side policy checks.
- Billing and authorization should gate API mutations, not only UI visibility.
