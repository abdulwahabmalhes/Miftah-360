# Miftah 360 - User Mobile App (`apps/mobile`)

## Ownership
- **Owner**: Mobile App Agent (Specialist Agent D)
- **Supervision**: Lead Architect & Orchestrator

## Scope & Capabilities (Phase 1)
- Customer Authentication (Email + Password, Phone OTP, Google Sign-In; international phone format).
- Garage & Vehicles management (Required: Brand, Model, Year, Mileage; Optional: Trim, Fuel, Transmission, VIN, Plate, Emirate, Expiry dates, Photo, Notes).
- Service Discovery: Manual Service Selection (via canonical Service Taxonomy) or AI Conversational Assistant.
- Workshop Matching & Discovery (Dubai & Sharjah launch emirates; browse eligible workshops, starting prices, ratings, distance).
- Service Request Dispatch (Strict 1 Request to 1 Selected Workshop).
- Booking Management (Preferred times, review/accept proposed times, cancellation per policy).
- Quote Review & Decision (Sole authority: Car Owner alone accepts or rejects Quote revision).
- Real-time Job Tracking (Confirmed/Authorized -> In Progress -> Completed).
- Invoices & Maintenance History (Offline settlement metadata `OUTSIDE_MIFTAH`, vehicle service logs).
- Post-Job Reviews (1 review per completed job card).
- Notifications & Support tickets.

## Invariants & Rules
- Dual language support mandatory: Arabic (RTL) and English (LTR).
- Currency: AED.
- Timezone display: Asia/Dubai.
- NEVER implement client-only authorization.
- NEVER allow AI to select workshop or diagnose mechanical issues with finality.

