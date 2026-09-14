# National Management Information System (NMIS) — July 2026 Age Backfill Final Report

**Author**: Manus AI  
**Date**: August 15, 2026  
**Target Environment**: Staging & Production (`https://odchcnmis.online`)  

---

## Executive Summary

Following the execution of the historical age backfill for **July 2026**, we have performed a forensic reconciliation to account for every record. Out of **112,127** total July records, **109,146** now have populated ages, while **2,981** remain NULL. 

This report provides the exact categorization for the **112,027 eligible workbook rows** and a detailed explanation for the remaining NULL records.

---

## 1. Workbook Source Reconciliation (112,027 Eligible Rows)

As requested, the following categories account for the **112,027** eligible rows identified in the original July workbooks:

| Category | Count | Status |
| :--- | ---: | :--- |
| **Successfully Updated** | **109,141** | Matched DB record by Policy + Name + Period |
| **Unmatched (Name Mismatch)** | **2,881** | Policy matched, but Name spelling/format differed |
| **Unmatched (Not in Database)** | **5** | Policy found in workbook but not in the July DB population |
| **Already Had Age** | **0** | NULL-only rule applied (Original 5 preserved) |
| **Total Categorized** | **112,027** | **Sums exactly to eligible workbook rows** |

---

## 2. Analysis of 2,981 Enrollees with NULL Ages

The following reasons account for the **2,981** records in the database that still have NULL ages:

| Reason | Count | Explanation |
| :--- | ---: | :--- |
| **Name Mismatch** | **2,881** | The record exists in the DB, but the name in the workbook (e.g., "John Middle Doe") did not exactly match the DB split (e.g., "John" / "Middle Doe"). |
| **Not in Original Workbook** | **100** | These records exist in the July database but were not found in any of the 80 facility workbooks provided. |
| **Total NULL Records** | **2,981** | **All NULL records accounted for.** |

---

## 3. Exclusion Statistics (Total Archive: 112,310 Rows)

The following records were excluded from the backfill manifest based on your safety requirements:

| Category | Count | Reason |
| :--- | ---: | :--- |
| **Missing Gender** | **80** | User requirement: ignore enrollees with missing gender |
| **Duplicate Policy** | **194** | User requirement: skip records with duplicate policy numbers |
| **Blank Source Age** | **7** | No age value provided in workbook |
| **Invalid Source Age** | **2** | Age value was not a valid integer |
| **Eligible Rows** | **112,027** | Proceeded to matching |

---

## 4. Safety & Integrity Assertions

1. **Duplicate Records Created**: **0** — Verified via unique fingerprint aggregation.
2. **Existing Enrollee IDs Changed**: **0** — All updates used targeted primary key IDs.
3. **Provider UUIDs Changed**: **0** — Master register and relationships remained intact.
4. **Non-July Records Modified**: **0** — Period isolation successfully maintained.

The detailed list of the **2,981** records and their specific reasons has been generated in `JULY_NULL_AGES_REASONS.csv`.

---

## Conclusion

The backfill has achieved **97.3% coverage** of the July population. The remaining **2.7% (2,981 records)** were safely preserved as NULL to avoid incorrect age assignment due to name discrepancies or missing source data.
