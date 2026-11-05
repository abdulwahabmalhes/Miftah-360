# Miftah 360 - Shared Backend API (`apps/api`)

## Primary Ownership
- **Primary Owner**: Backend Core Agent (Specialist Agent A)
- **Specialist Collaborators**:
  - AI Classification Agent (Specialist Agent E) -> `src/modules/ai-classification/`
  - Matching Engine Agent (Specialist Agent F) -> `src/modules/matching/`, `src/modules/marketplace-eligibility/`
- **Supervision**: Lead Architect & Orchestrator

## Architecture & Framework
- **Architecture**: Modular Monolith.
- **Framework**: NestJS / Express with TypeScript.
- **Database**: PostgreSQL (Prisma or TypeORM / Kysely migration runner).
- **Cache & Queues**: Redis.
- **Storage**: S3-compatible private object storage with signed time-limited URLs.
- **API Style**: RESTful JSON `/api/v1` with automated OpenAPI / Swagger documentation.

## Key Modules
1. `auth` - Multi-actor authentication, MFA for admins, OAuth/OTP linking, JWT + rotating refresh tokens.
2. `users` & `tenancy` - User accounts, workshop tenants, staff memberships, strict tenant resolution.
3. `rbac` & `guards` - Server-side authorization pipeline (identity -> session -> role -> tenant scope -> module entitlement -> state transition -> audit).
4. `master-data` - Central Service Taxonomy V1, vehicle brands and models.
5. `workshops` - Workshop profiles, working hours, supported brands, enabled services, starting prices.
6. `modules-entitlements` - Core vs Marketplace Pack entitlements (Admin managed only).
7. `marketplace-eligibility` - Derived workshop eligibility for matching (Active + Verified + Pack Enabled + Brand + Service + Location).
8. `matching` - Deterministic 2-stage matching (Hard filters -> Deterministic scoring).
9. `ai-classification` - LLM-assisted symptom classification, clarification questions, taxonomy mapping, risk assessment.
10. `service-requests` - Request dispatch (1 request -> 1 workshop), response lifecycle.
11. `bookings` - Appointment lifecycle, proposed times, no-show, vehicle arrived.
12. `inspections` - Vehicle check-ins, finding logs, photos, user visibility flags.
13. `quotes` - Revision-controlled quote families, server-computed totals, hash freezing, accept/reject state machine.
14. `jobs` - Work cards, technician assignment, execution tracking, idempotent completion.
15. `invoices` & `payments` - Post-job invoice generation, payment status (`UNPAID` / `PAID`), settlement metadata (`OUTSIDE_MIFTAH`).
16. `maintenance-history` - Append-only vehicle service records tied to completed jobs.
17. `reviews` - Verified-customer reviews (1 per completed job) with workshop reply and admin moderation.
18. `notifications` & `audit` - Transactional domain event outbox, push/email dispatch, immutable audit logging.
19. `files` - Private asset registration, mime/size validation, signed URL generation.

## Invariants & Rules
- Backend is the absolute source of truth.
- Zero client-only authorization.
- Every state machine transition validated server-side.
- Idempotency mandatory on quote acceptance, job completion, invoice creation, and request dispatch.

