# Miftah 360 - Admin Dashboard Web App (`apps/admin-web`)

## Ownership
- **Owner**: Admin Dashboard Agent (Specialist Agent B)
- **Supervision**: Lead Architect & Orchestrator

## Scope & Capabilities (Phase 1)
- Platform Admin Authentication (Email + Password + Mandatory MFA/OTP; no Google; strict session limits).
- Admin Roles (Super Admin, Operations Admin, Support Admin).
- Workshop Verification & Lifecycle Management (Pending Verification -> Active | Rejected; Suspend, Reactivate, Inactivate).
- Module & Entitlement Controls (Core module always enabled; Marketplace Pack enabled/disabled only as complete pack; grant source logging).
- Marketplace Participation Controls (Governs whether an active workshop participates in consumer discovery and matching).
- Master Data Management (Central Service Taxonomy V1 activation, vehicle brands, vehicle models).
- Platform Operations & Governance (Monitor service requests, bookings, jobs, quotes, invoices; review moderation: hide/unhide).
- Audit Trail & Logs Explorer (Comprehensive audit inspection for sensitive mutations).
- Support Ticketing & Dispute Management.

## Invariants & Rules
- Dual language support: Arabic (RTL) and English (LTR).
- Display Timezone: Asia/Dubai.
- Only Miftah Admin controls workshop activation, marketplace participation, and module entitlements.
- Admins CANNOT approve a quote on behalf of a car owner or alter accepted quote values silently.
- All sensitive status changes require a documented reason code and are written synchronously to the audit log.

