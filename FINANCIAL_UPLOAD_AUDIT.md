# Financial upload audit

## Current bottlenecks

The uploader can inspect workbooks and suggest mappings, but the current flow has several correctness gaps: the worksheet selector re-processes the file without changing the selected sheet; pending queue items cannot be selected because the queue click handler excludes `pending`; provider resolution offers only a long native select with no search; the mapping step does not block on missing provider/amount/period fields or low-confidence mappings; the preview marks a row ready when only `providerId` exists and displays only `amountPaid`, even when the normalized financial value is in another amount field; duplicate checks are defined in the repository but not invoked before commit; and the commit path ignores the server-returned imported/duplicate/error counts and reports the client-side ready count as success.

The 2025CAPANDFFS workbook is a horizontal financial schedule: `PROVIDERS`, an unnamed row-type column containing `CAPITATION` or `FFS`, and month columns `JAN` through `DEC`. The existing normalizer expands month columns, but it uses the uploader's single selected `dataType` for every expanded record and does not preserve the row-level CAPITATION/FFS distinction. This can place both row types under one data type and distort financial analytics.

## Targeted remediation

1. Add row-type recognition for CAPITATION and FFS schedules, preserving the row-level type while still supporting ordinary claim/capitation/FFS workbooks.
2. Make mapping deterministic: protect provider, amount, month, year, claims, and row-type fields from being overwritten by generic keywords; expose row-type mapping in the mapping options.
3. Enforce required mapping and low-confidence review before matching.
4. Make queue items selectable even while pending, and process the selected sheet directly without losing the current item.
5. Add a searchable provider-resolution control and only allow preview when every unique facility is confirmed.
6. Add local duplicate detection to preview and invoke the existing duplicate-batch check before commit.
7. Use the actual server-returned import result for the success message and imported/duplicate/error counts; do not claim success from RPC completion alone.
8. Display the normalized amount using a consistent precedence across amount fields.

No database schema or production data changes are required for these frontend/service corrections. The existing secure RPC boundary remains the persistence path.
