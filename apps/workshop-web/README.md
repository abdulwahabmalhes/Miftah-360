# Miftah 360 - Workshop OS Web App (`apps/workshop-web`)

## Ownership
- **Owner**: Workshop OS Agent (Specialist Agent C)
- **Supervision**: Lead Architect & Orchestrator

## Scope & Capabilities (Phase 1)
- Workshop Staff Authentication (Email + Password, Phone OTP; strictly NO Google Sign-In).
- Tenant Profile Management (Permitted profile fields, primary location in Dubai/Sharjah, working hours, supported brands or "All Brands", enabled services from central taxonomy with non-binding starting prices).
- Staff & Role Management (Fixed Phase 1 roles: Workshop Owner, Service Advisor, Reception, Technician; invite/activate/deactivate staff).
- Operational Pipeline:
  - Incoming Requests Inbox (Accept, Reject, Propose Alternative Time).
  - Booking Calendar (Confirm, Mark Vehicle Arrived, Mark No-Show, Cancel).
  - Vehicle Inspection (Digital check sheets, inspection findings, user-visible summaries vs internal notes).
  - Quotes Engine (Create draft, add items from taxonomy, send immutable revision, revise on scope change).
  - Job Execution Management (Assign technician, move to In Progress once authorized, record notes/photos, complete job).
  - Invoices & Payment Recording (Draft -> Issued -> Cancelled; record payment status Unpaid -> Paid with settlement source `OUTSIDE_MIFTAH`).
  - Operational CRM & Reviews (Customer profile, vehicle history, reply to customer reviews, basic reports).

## Invariants & Rules
- Backend-enforced Tenant Isolation on every single query and mutation.
- Dual language support mandatory: Arabic (RTL) and English (LTR).
- Workshop Owner/Staff CANNOT enable or disable modules or bypass Admin verification.
- Workshop Staff CANNOT approve quotes on behalf of the customer.
- Paid execution cannot begin without an accepted Quote revision.
- Multi-branch is strictly out of Phase 1.

