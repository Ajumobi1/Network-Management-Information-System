# ODCHC Checklist Supabase Integration

The ODCHC checklist now includes a **Submit to NMIS** action. The original checklist interface remains browser-compatible and continues to support local drafts and PDF export. When the page is opened through the authenticated NMIS route, the host page passes the current Supabase session to the checklist iframe through a same-origin `postMessage`. The checklist then calls the protected `nmis_save_odchc_checklist_submission` RPC.

## Database setup

Apply [`20260923000000_odchc_checklist_submissions.sql`](../supabase/migrations/20260923000000_odchc_checklist_submissions.sql) in the project’s Supabase SQL migration workflow. The migration creates `public.odchc_checklist_submissions`, enables row-level security with direct access denied, adds indexes, creates an authenticated `SECURITY DEFINER` RPC, and records an audit-log event for every submitted checklist.

The RPC accepts the four checklist types: `primary`, `dental`, `pharmacy`, and `qa`. It stores the facility profile, structured response maps, score summary, recommendation, inspection date, and the complete raw checklist payload. A stable client submission identifier makes repeated clicks for the same draft idempotent while a new checklist session receives a new identifier.

The follow-up migration [`20260924000000_odchc_checklist_submission_history.sql`](../supabase/migrations/20260924000000_odchc_checklist_submission_history.sql) creates the protected list and detail RPCs used by the **Quality & Compliance → Submission History** page. The page supports facility, submission-code, and email search; checklist-type filtering; pagination; and expandable profile, response, and raw-payload details.

## Application behavior

The static checklist runtime in `public/odchc-checklist/app.js` builds the raw payload and submits it with the authenticated access token. The NMIS host page in `src/pages/ODCHCChecklistPage.tsx` supplies the Supabase URL, public anon key, and current access token without exposing a service-role key. No privileged Supabase key is placed in the browser.

Submission is available to authenticated users whose NMIS role is one of `super-admin`, `executive`, `head-of-network`, `network-officer`, or `inspector`. The database RPC enforces this allow-list independently of the browser UI. The existing validation rules run before submission, including required facility name, address, and inspection date checks.

## Deployment checklist

After applying the migration, deploy the website with the normal Vercel pipeline and confirm that the deployment has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured. Log in to NMIS, open **Quality & Compliance → ODCHC Checklist App**, complete a checklist, and select **Submit to NMIS**. The success message returns the generated `ODCHC-...` submission code.

After applying the history migration as well, open **Quality & Compliance → Submission History** to browse submissions available to the authenticated inspection roles. If the page reports that its RPC cannot be found, apply the second migration and run `NOTIFY pgrst, 'reload schema';` in the Supabase SQL Editor.

For verification, query the table from an authorized NMIS session or use the existing audit-log viewer. Do not grant the browser direct table access and do not use a Supabase service-role key in the frontend.
