# Miftah 360 - Shared Contracts & Types (`packages/contracts`)

## Ownership
- **Owner**: Backend Core Agent (Specialist Agent A)
- **Supervision**: Lead Architect & Orchestrator

## Purpose
Provides single-source-of-truth TypeScript types, interfaces, state enums, API request/response DTOs, and error envelopes shared between:
- `apps/api`
- `apps/workshop-web`
- `apps/admin-web`
- `apps/mobile` (or schema generation targets for Flutter)
- `tests/e2e`

## Core Artifacts
1. **Canonical Enums**:
   - `WorkshopStatus`: `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `INACTIVE`, `REJECTED`
   - `ServiceRequestStatus`: `DRAFT`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `CLOSED`
   - `BookingStatus`: `PENDING`, `ACCEPTED`, `TIME_PROPOSED`, `CONFIRMED`, `VEHICLE_ARRIVED`, `INSPECTION`, `QUOTE_SENT`, `QUOTE_APPROVED`, `IN_PROGRESS`, `COMPLETED`, `NO_SHOW`, `CANCELLED`
   - `QuoteRevisionStatus`: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `SUPERSEDED`
   - `JobStatus`: `CREATED`, `INSPECTION`, `AWAITING_APPROVAL`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
   - `InvoiceStatus`: `DRAFT`, `ISSUED`, `CANCELLED`
   - `PaymentStatus`: `UNPAID`, `PAID`
   - `SettlementSource`: `OUTSIDE_MIFTAH`
   - `ReviewStatus`: `PUBLISHED`, `HIDDEN`
   - `Role`: `CAR_OWNER`, `WORKSHOP_OWNER`, `SERVICE_ADVISOR`, `RECEPTION`, `TECHNICIAN`, `OPERATIONS_ADMIN`, `SUPPORT_ADMIN`, `SUPER_ADMIN`
2. **Service Taxonomy V1 Constants**:
   - Mechanical (`MECH_*`), Electrical (`ELEC_*`), AC (`AC_*`), Maintenance (`MAINT_*`), Tyres (`TYRE_*`), Car Care (`CARE_*`).
3. **Standard Error Envelope**:
   ```json
   {
     "error": {
       "code": "STRING_ERROR_CODE",
       "message": "Human-readable message",
       "details": {},
       "correlation_id": "uuid-v4"
     }
   }
   ```

