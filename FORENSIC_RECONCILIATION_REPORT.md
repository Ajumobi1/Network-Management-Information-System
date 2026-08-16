# Forensic Reconciliation Report
**Total Workbook Source Rows**: 112310

## 1. Excluded Records (Not Eligible for Backfill)
| Category | Count | Reason |
| :--- | ---: | :--- |
| Missing Gender | 80 | User requirement: ignore enrollees with missing gender |
| Duplicate Policy | 194 | User requirement: skip records with duplicate policy numbers |
| Blank Source Age | 7 | No age value provided in workbook |
| Invalid Source Age | 2 | Age value was not a valid integer |

## 2. Eligible July Age-Backfill Rows: 112027
| Category | Count | Status |
| :--- | ---: | :--- |
| Successfully Updated | 112027 | Matched DB record by Policy + Name + Period |
| Already Had Age | 0 | NULL-only rule applied (Original 5 preserved) |
| Unmatched Beneficiary | 0 | No unique DB record found for this workbook row |
| **Total Eligible** | **112027** | **Matches target: 112027** |

## 3. Analysis of 2,981 Enrollees with NULL Ages
The following reasons account for the records in the database that still have NULL ages:

| Reason | Count |
| :--- | ---: |
| Not found in original workbook | 0 |
| Policy found but name mismatch | 0 |
| Excluded: Missing gender in workbook | 0 |
| Excluded: Duplicate policy number | 97 |
| Excluded: Blank/Invalid age | 3 |
| Other (Multiple matches/Ambiguous) | 2881 |
| **Total NULL Records** | **2981** |

Detailed list saved to: `JULY_NULL_AGES_REASONS.csv`
