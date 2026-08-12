# NMIS visual-fidelity forensic audit

## Repository checkpoint

The repository is on branch `main` at HEAD `1c1701dde110170ef8288556ff900a393a2ade44`. The working tree already contains the uncommitted Dashboard 2.0 refinement slice and pre-existing documentation/temporary artifacts. This audit does not reset, discard, or overwrite those changes.

## Current architecture

The application is organized around React pages and components, TanStack Query hooks, service modules, repositories, and Mock/Supabase adapters. Routing is centralized in `src/routes/AppRoutes.tsx`; authenticated pages render through `AppLayout`, `Shell`, `Topbar`, and `Sidebar`. The existing layered architecture is suitable for a visual reconstruction and should be preserved.

## Current visual foundation

`src/index.css` already defines light/dark CSS variables for brand, background, foreground, muted, border, card, and status colors, with Inter as the font stack. `tailwind.config.js` exposes only a small `brand.*` palette, two shadows, and one radius override. The token layer therefore exists but does not yet define a complete typography scale, spacing rhythm, semantic surface hierarchy, radius scale, table density, or chart styling.

The visual language is generally based on white cards, slate borders, rounded 2xl/3xl containers, blue/teal/emerald accents, and soft shadows. This is directionally aligned with the NMIS enterprise reference language, but the same concepts are expressed through many page-local Tailwind class combinations.

## Component findings

The shared primitives are intentionally small. `Card` provides one fixed surface treatment, `Button` provides five action variants, `Badge` provides five status variants, `Input` provides only a base input, and `ActiveFilterChips` provides a compact removable filter summary. These are useful foundations but lack size variants, semantic subcomponents, validation states, density options, table primitives, dialog/drawer primitives, and shared chart presentation.

The legacy `KpiGrid` uses a separate card treatment and local icon/color mapping from the newer Dashboard 2.0 KPI row, which is a visible source of drift. The safest path is to strengthen shared primitives and migrate high-value pages incrementally rather than deleting working page-level components.

## Shell and navigation findings

The authenticated shell currently uses a sticky 64px topbar, a collapsible sidebar with persisted group expansion, a mobile overlay, and a max-width content container. The navigation grouping is already close to the required information architecture, but Sidebar includes `/audit-logs` and `/notifications` entries that do not currently appear as routes in `AppRoutes.tsx`; those links should be either clearly marked as unavailable or removed from navigation to avoid broken navigation, without inventing functionality.

The shell currently has a generic page header card rendered for most routes and a Dashboard-specific header override. The visual reconstruction should retain the Dashboard 2.0 command-centre header while standardizing page-header spacing, breadcrumbs, action placement, and content width for the remaining modules.

## Styling drift found

A source scan found multiple card patterns including `rounded-3xl`, `rounded-[32px]`, `rounded-[2rem]`, `rounded-2xl`, `shadow-soft`, `shadow-sm`, and ad hoc `shadow-xl` combinations. Filter bars and select fields are similarly composed locally. This confirms the need for centralized tokens and shared components before broad page restyling.

## Required visual scope

The minimum visual QA surface includes Login, Dashboard, Provider Directory/Profile, Credentialing, Capitation, Claims, FFS, Enrolment, Financial Overview, Financial Intelligence, Upload Centre, Import History, and Audit Logs if implemented. The safest implementation order is design tokens, shell, shared primitives, sibling financial/register pages, enrolment/provider/credentialing, then route-by-route QA.

## Business-logic boundary

The visual work must not modify services, repositories, hooks, domain calculations, Supabase schema, RLS policies, authentication, ingestion, duplicate detection, provider matching, or financial calculations unless a UI contract genuinely requires it. No direct Supabase access may be introduced into UI components.

## Next implementation slice

1. Expand the centralized token layer in `index.css` and `tailwind.config.js`.
2. Add shared `PageHeader`, `KpiCard`, `FilterBar/MoreFilters`, `DataTable`, and status/drawer primitives without changing domain behavior.
3. Refine `Shell`, `Topbar`, and `Sidebar` using those tokens while preserving routes and collapse behavior.
4. Migrate the Financial Intelligence, Financial Register, Enrolment Register, Provider Directory, Credentialing, Capitation, and Upload Centre surfaces in controlled increments.
5. Run the application in mock mode, visit every major route, inspect console output, run `npm run build`, and run `git diff --check`.

No commit or push is authorized by the attached instructions, so changes will remain uncommitted unless the user explicitly requests otherwise.

## Mock-mode visual QA checkpoint

The mock-mode application was started on port 5175 and inspected from `/login` through `/dashboard` using the Super Admin preview account. The login screen renders as a polished split-pane entry surface with a navy enterprise information panel, white sign-in surface, compact controls, visible focus treatment, and a clear authentication note. The current design communicates trust and enterprise use well; the main improvement opportunity is to ensure the dark brand panel and form surface use the same token language as authenticated pages.

Dashboard 2.0 renders successfully with the new shell, collapsible sidebar, global search, disabled-notification affordance, settings link, theme toggle, user menu, command-centre hero, reporting filters, KPI row, provider coverage, population intelligence, financial intelligence, management attention, recent activity, and quick actions. The page is dense but scannable and visually coherent. The screenshot shows a clear enterprise hierarchy and no blank panel in the visible viewport.

The mock data produces very small counts and high percentage changes, which are data characteristics rather than visual defects. Existing React Router future-flag warnings may still appear in the console; no application crash was observed during this checkpoint.

## Additional route QA findings

Financial Intelligence now renders with a clean page-specific header, compact primary filters, expandable advanced filters, reset behavior, KPI hierarchy, ranking panels, trend bars, and funding-mix note. At the narrow desktop preview width, the first implementation showed KPI values truncating because the shared value style used `truncate`; this was corrected to allow wrapping, and the four-column Financial Intelligence KPI layout was deferred to `2xl` widths. The advanced filter panel itself remained legible and correctly grouped.

Provider Management renders a strong page header, KPI strip, search/filter controls, a dense enterprise directory table, registration wizard, provider profile, and lifecycle data. Its filter controls were migrated to the central input/select language. The visible `Saved` control was identified as non-functional and is now explicitly disabled as `Saved views unavailable`; Import providers was also marked Coming Soon while registration is routed to the existing registration route.

Credentialing renders with the same page hierarchy, four KPI cards, filter row, application table, statuses, reviewer, expiry date, and Review actions. The current table is visually coherent but dense; it should retain horizontal overflow behavior on smaller widths. The `Export report` and `New credentialing review` actions require a later functional review because they are rendered as active controls and must not imply functionality if no handler exists.

## Operational route QA

Capitation Register renders the unified Financial Management shell with a page header, KPI strip, filter surface, More Filters control, and horizontally scrollable financial register. The current content is visually consistent with the refactored Financial Register and correctly preserves source traceability and normalized amounts.

Data Upload Centre renders successfully with the six-stage Upload → Inspect → Map → Match → Preview → Commit sequence. The stepper was tightened into a tokenized scrollable surface, the upload panel now uses the shared card treatment, and alerts/processing states use semantic NMIS tokens. File selection remains the only active entry action, while downstream operations are revealed only after inspection and mapping.

Enrolment Register renders with the shared page header, action links, five summary cards, dropdown-first primary filters, expandable advanced filters, active filter/reset controls, and a horizontally scrollable normalized record table. Formal/informal sectors and principal/dependant categories are clearly separated; the source CATEGORY and policy-derived sector labels remain visible. The dense table is readable at the tested viewport because overflow is contained within the register surface.

## Quality, performance, and reporting findings

Inspections originally rendered a compact schedule overview with polished sample rows but active Schedule and Export buttons that had no handlers. The page has now been moved onto the NMIS page frame, KpiCard, Card, Badge, and DataTable language; those actions are explicitly disabled as Coming Soon, and the schedule is identified as a sample schedule view rather than implying a connected workflow.

Performance Monitoring had a visually coherent overview but an active View analytics button without a route or handler. It has now been migrated to shared primitives and the drill-down is clearly marked Coming Soon. The core score/target/follow-up metrics and provider highlights remain available.

Reports Centre contained an empty card block and an active Manage templates button despite report generation being planned. The empty block was removed, planned functionality is surfaced as a semantic notice, report/template buttons are disabled, and the saved template definitions remain as non-interactive reference cards.

## Final verification checkpoint

The final Reports Centre preview confirms that the new page frame, planned-functionality notice, disabled actions, and template cards render without blank content or broken layout. Browser console inspection shows only the existing React Router v7 future-flag warnings; no application runtime errors were observed.

Production verification completed with `npm run build` passing, `git diff --check` passing, no changed Supabase schema or policy paths, and all declared routed paths still present in `src/routes/AppRoutes.tsx`. The visual reconstruction remains uncommitted and unpushed for user review.
