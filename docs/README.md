# Miftah 360 - Documentation & Source of Truth (`docs`)

## Purpose
This directory contains all approved product, architecture, decision records, and implementation specifications for the Miftah 360 Phase 1 Platform.

## Source Precedence Rules
When documents conflict, the following strict precedence order MUST be applied:

1. **`00_START_HERE_Miftah_360_Implementation_Pack_V1`** (`docs/IMPLEMENTATION READY V1/`)
2. **`01_Business_Rules_V1_2_PO_Decision_Register`** (`docs/IMPLEMENTATION READY V1/`)
3. **`03_Canonical_State_Machines_V1`** (`docs/IMPLEMENTATION READY V1/`)
4. **`04_Roles_and_Permissions_Matrix_V1`** (`docs/IMPLEMENTATION READY V1/`)
5. **`02_Service_Taxonomy_V1`** (`docs/IMPLEMENTATION READY V1/`)
6. **`05_Data_Model_and_ERD_V1`** (`docs/IMPLEMENTATION READY V1/`)
7. **`06_Backend_and_System_Architecture_V1`** (`docs/IMPLEMENTATION READY V1/`)
8. **`07_API_Specification_V1`** (`docs/IMPLEMENTATION READY V1/`)
9. **`08_Implementation_Blueprint_and_Build_Plan_V1`** (`docs/IMPLEMENTATION READY V1/`)
10. **`09_QA_and_Acceptance_Checklist_V1`** (`docs/IMPLEMENTATION READY V1/`)
11. **Existing Project Bible / PRDs / ADR Documents**:
    - `docs/Miftah 360 - Phase 1.docx`
    - `docs/Miftah_360_Project_Bible_V1_1.docx`
    - `docs/PRD/Miftah_360_User_App_PRD_V1_1.docx`
    - `docs/PRD/Miftah_360_Workshop_OS_PRD_V1_1.docx`
    - `docs/PRD/Miftah_360_Admin_Dashboard_PRD_V1_1.docx`
    - `docs/Miftah_360_Modular_Workshop_OS_Architecture_Decision_Record_V1.docx`

## Rules for All Agents & Engineers
- The Coding Agents MUST NOT invent product rules or redefine canonical statuses.
- In case of any conflict between PRDs and the Implementation Pack, the higher-precedence source wins.
- Any unresolved product ambiguity must be marked with a `TODO(Lead-Architect)` flag and escalated.

