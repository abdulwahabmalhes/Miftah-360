# Miftah 360 - End-to-End & Integration Test Suite (`tests/e2e`)

## Ownership
- **Owner**: QA / Integration Agent (Specialist Agent G)
- **Supervision**: Lead Architect & Orchestrator

## Test Suites & Responsibilities
1. **Tenant Isolation Verification**:
   - Verify Workshop A staff cannot read, update, or delete Workshop B bookings, customers, vehicles, quotes, jobs, invoices, or notes.
   - Verify non-admin actors cannot execute cross-tenant queries.
2. **RBAC & Authorization Matrix**:
   - Verify Reception role cannot issue quotes or edit financial fields.
   - Verify Technician role cannot alter pricing or approve quotes.
   - Verify Service Advisor cannot modify workshop modules or staff.
   - Verify Workshop Owner cannot toggle module entitlements or activate workshop.
   - Verify only Car Owner can Accept or Reject a Quote revision.
3. **State Machine Invariant Tests**:
   - Service Request transitions (`DRAFT` -> `SUBMITTED` -> `ACCEPTED` / `REJECTED` / `CANCELLED`).
   - Booking transitions (`PENDING` -> `ACCEPTED` / `TIME_PROPOSED` -> `CONFIRMED` -> `VEHICLE_ARRIVED` -> `INSPECTION` -> `QUOTE_SENT` -> `QUOTE_APPROVED` -> `IN_PROGRESS` -> `COMPLETED`).
   - Quote Revision immutability: modifying sent revision fails; creating new revision supersedes previous; old revisions cannot be accepted; accepted revision is frozen.
   - Job authorization guard: moving job to in-progress without an accepted quote fails.
4. **Idempotency & Concurrency Tests**:
   - Job completion idempotency: multiple complete calls yield exact same single invoice, single payment, single maintenance record without duplicates.
   - Duplicate service request creation protection.
5. **Deterministic Matching Engine Tests**:
   - Verify hard filtering on launch emirates (Dubai, Sharjah), workshop status (`ACTIVE`), verification (`verified_at`), marketplace participation, Marketplace Pack entitlement, supported brand, and enabled service.
   - Verify deterministic ranking order and exclusion reason logging.
   - Verify AI output cannot inject workshop selection into matching.
6. **Full Golden Flow Automated Acceptance**:
   - Complete execution of the 17-step Golden Flow from User Signup to Post-Job Review.

