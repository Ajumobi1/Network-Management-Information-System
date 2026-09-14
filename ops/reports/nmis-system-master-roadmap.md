# NMIS System Master Roadmap & Forensic Audit Report

**Date:** August 11, 2026
**Repository:** Ajumobi1/NMIS-Frontend
**Current HEAD:** 6e80d53 (feat: enrolment management)
**Status:** Forensic Audit Complete — Production Readiness Review

---

## Executive Summary

The NMIS application has achieved a robust functional baseline with core modules (Authentication, Provider Management, Financial Hub, Enrolment) operational in a "Supabase-ready" architecture. However, the system currently suffers from **Master Data Drift** in mock environments and lacks a unified **Financial Intelligence Layer** to bridge the gap between enrolment population and financial expenditure.

---

## Part 1 — Forensic Audit Findings

### 1.1 Executive Dashboard Connectivity
| Metric Group | Status | Forensic Finding |
| :--- | :--- | :--- |
| **Provider Network** | ✅ Genuinely Connected | Derives Total/Active counts and Regional spread from `providersRepository`. |
| **Financial Overview** | ✅ Genuinely Connected | Derives Total Expenditure from `financialDataRepository`. |
| **Enrolment** | ❌ Disconnected | Enrolment metrics (Total, Sector Mix, PEPM) are absent from the dashboard despite being available in the repository. |
| **Network Performance**| ⚠️ Partially Mocked | Inspection, Performance, and Utilization trends remain isolated mocks. |

### 1.2 Cross-Module Integration & Master Data
- **Authoritative Source**: The `Provider Directory` is the source of truth.
- **Master Data Drift**: Significant drift detected in `financialDataMocks.ts`. Several records use incorrect `providerId` or `providerCode` mapping (e.g., `prov-5` mapped to `Ikeja Pharmacy` instead of `Ibadan Eye Specialist`).
- **Consistency**: Authoritative Provider IDs are used consistently in the **Enrolment** and **Provider** modules, but **Financial** records require a forensic re-alignment.

### 1.3 Data Ingestion Workflow
- **Ingestion Engine**: Robust 6-step workflow (Upload → Inspect → Map → Match → Preview → Validate → Commit).
- **Authoritative Matching**: Genuinely uses persisted manual resolutions to reduce operational friction.
- **Duplicate Protection**: Fingerprinting is implemented at the record level using `provider|period|type|amount`.

### 1.4 Enrolment & Classification
- **Sector Derivation**: Correctly uses `/C/` (Formal) and `/D/` (Informal) policy number logic.
- **Category Authority**: Correctly prioritizes source `CATEGORY` (Principal/Dependant) over policy number suffixes.
- **PEPM Linkage**: Successfully joins enrolment and financial data by period to calculate expenditure per enrollee.

---

## Part 2 — Module Status Classification

| Module | Classification | Implementation Note |
| :--- | :--- | :--- |
| **Authentication** | A. Production-ready | Full RBAC and invite workflow implemented. |
| **Provider Management** | A. Production-ready | Mature lifecycle CRUD and registration wizard. |
| **Financial Data Hub** | A. Production-ready | High-utility ingestion engine and history tracking. |
| **Enrolment Mgmt** | B. Functional | Recently implemented; requires dashboard integration. |
| **Executive Dashboard** | B. Functional | Requires migration of mocked trends to live domain data. |
| **Credentialing** | B. Functional | Accreditation lifecycle operational; needs document audit. |
| **Capitation Mgmt** | B. Functional | Operational; needs physical file export generation. |
| **Contracts** | C. Partially Implemented | Repository exists; UI is basic/placeholder. |
| **Inspections** | C. Partially Implemented | Service exists; UI needs operational hardening. |
| **Audit Logs** | C. Partially Implemented | Repository active; needs management UI. |
| **Reports** | D. Placeholder | UI labeled "Planned"; requires Reporting Service. |
| **Complaints/Comm** | D. Placeholder | UI labeled "Planned"; requires domain implementation. |

---

## Part 3 — NMIS System Master Roadmap

### P0: Critical (Immediate Action Required)
| Task | Problem | Recommended Solution |
| :--- | :--- | :--- |
| **Master Data Alignment** | Mock data drift in `financialDataMocks.ts` causes broken analytics. | Re-align all mock financial records to use authoritative IDs/Codes from `providersMocks.ts`. |
| **Enrolment Integration** | Executive Dashboard lacks population health metrics. | Refactor `dashboardRepository` to include `fetchEnrolmentAnalytics` data. |
| **RLS Verification** | Hardened schema exists but isn't verified against live roles. | Perform a security handshake between Supabase Auth Metadata and RLS policies. |

### P1: High (Functional Hardening)
| Task | Problem | Recommended Solution |
| :--- | :--- | :--- |
| **Financial Intelligence Layer** | Expenditure and Enrolment are siloed. | Implement a unified `FinancialIntelligenceService` to handle PEPM, LGA-level health costs, and Peer Efficiency metrics. |
| **Reporting Centre** | Reports module is a placeholder. | Build a generic `ReportService` with Excel/PDF export using `SheetJS` and `jsPDF`. |
| **Audit Log UI** | No way to view system-wide audit trails in the UI. | Build the `AuditLogsPage` using the existing `auditRepository`. |

### P2: Medium (Module Completion)
| Task | Problem | Recommended Solution |
| :--- | :--- | :--- |
| **Inspections & Performance** | Modules remain partially implemented. | Build the operational Inspection workflow and connect Performance gauges to live data. |
| **Communication Hub** | Lacks provider-facing communication tools. | Implement the `CommunicationRepository` for Email/SMS/Notification history. |

### P3: Future (System Optimization)
| Task | Problem | Recommended Solution |
| :--- | :--- | :--- |
| **GIS Mapping** | Coverage map is a Leaflet placeholder. | Implement live GIS heatmaps for provider and enrolment density. |
| **AI Insights** | Dashboard insights are static mocks. | Integrate a lightweight LLM service to analyze expenditure trends and risk flags. |

---

## Part 4 — Recommended Data Model for Financial Intelligence

To enable advanced querying (e.g., "Which LGAs have the highest expenditure per enrollee?"), I recommend a **Unified Analytics Schema**:

1.  **Fact Table: `network_performance_snapshots`**
    - `period` (Key)
    - `provider_id` (Key)
    - `lga` / `state` / `senatorial_district`
    - `enrolment_total` / `enrolment_formal` / `enrolment_informal`
    - `expenditure_claims` / `expenditure_capitation` / `expenditure_ffs`
    - `pepm` (Calculated)

2.  **Star Join**:
    - Central Dimension: `Providers` (ID, Code, Type, Ownership).
    - Linkage: All financial and enrolment data joined via `ProviderID` + `Period`.

---

## Part 5 — Verification & Safety Confirmation

- **Repository Integrity**: The GitHub repository and working tree were **NOT modified** during this audit.
- **Build Quality**: The system remains in a clean, buildable state (`npm run build` PASS).
- **Mock Mode**: `VITE_USE_MOCK_DATA=true` remains the authoritative dev environment.

**I recommend proceeding with the P0 tasks immediately to stabilize the analytics foundation before building the Reporting Centre.**
