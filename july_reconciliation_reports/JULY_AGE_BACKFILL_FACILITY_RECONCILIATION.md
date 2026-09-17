# July 2026 Age Backfill — Facility-by-Facility Reconciliation

No database writes were performed while generating this report. The policy-based update has already completed; this report is read-only reconciliation of the resulting state and the original source archive.

## Final Database State

| Metric | Count |
|---|---:|
| July enrollee records | 112,127 |
| Ages populated | 112,027 |
| Ages still NULL | 100 |
| Duplicate fingerprints | 0 |

## Source Archive Counts

| Category | Raw count | Primary-partition count |
|---|---:|---:|
| Total source rows with policy | 112300 | 112300 |
| Duplicate-policy occurrences | 194 | 194 |
| Missing gender | 70 | 70 |
| Blank source age | 8 | 7 |
| Invalid source age | 2 | 2 |
| Eligible rows | 112027 | 112027 |

Raw categories can overlap. The primary-partition column assigns each source row one reason in this order: duplicate policy, missing gender, blank age, invalid age, then eligible. Therefore the primary partition sums exactly to the total source rows.

## Eligible Rows and Result

| Category | Count |
|---|---:|
| Eligible source rows | 112,027 |
| Updated by original composite/fingerprint path | 109,146 |
| Updated by policy-only correction for unique July policy | 2,881 |
| Total ages populated from eligible source rows | 112,027 |
| Eligible source rows not applied | 0 |

## Records Still Without Age

There are **100 July database records still carrying NULL age**. They were not present in the provided original July workbook archive, so there is no source age to assign. They are listed individually in `database_remaining_null_age_records.csv` and grouped by facility in `database_remaining_null_by_facility.csv`.

| Facility | LGA | Remaining NULL ages |
|---|---|---:|
| AKURE ANGLICAN DIOC. MED. CENTER ANGLICAN COMMUNITY, AKURE | Akure South | 1 |
| CHRISTBAY CONSULTANTS HOPITAL,AKURE | Akure South | 1 |
| COLLEGE OF HEALTH TECHNOLOGY CLINIC, ODA ROAD, AKURE | Akure South | 1 |
| FIRST MERCY SPECIALIST HOSPITAL AKURE | Akure South | 1 |
| FUTA TEACHING HOSPITAL (UNIMEDTHC), AKURE | Akure South | 7 |
| GENERAL HOSPITAL IFON | Ose | 2 |
| GENERAL HOSPITAL IGBOKODA | Ilaje | 2 |
| GENERAL HOSPITAL IJU ITAOGBOLU | Akure North | 1 |
| GENERAL HOSPITAL IPE-AKOKO | Akoko South East | 1 |
| GENERAL HOSPITAL IWARO OKA | Akoko South West | 1 |
| GENERAL HOSPITAL ORE | Odigbo | 1 |
| GENERAL HOSPITAL OWO | Owo | 3 |
| GENERAL HOSPITAL, ILE-OLUJI | Ile Oluji/Okeigbo | 3 |
| GOODIES HOSPITAL & DIAGNOSTICS LTD ONDO | Ondo West | 1 |
| MAO HOSPITAL LIMITED, IROWO, AKURE | Akure South | 2 |
| MERCYLAND MEDICAL CENTRE, ONDO | Ondo West | 2 |
| NEWDAY MEDICAL CENTER, IJAPO, AKURE(-4) | Akure South | 7 |
| NIGERIAN POLICE MEDICAL SERVICES, AKURE | Akure South | 7 |
| PRIMARY HEALTH CLINIC IGOBA | Akure North | 2 |
| PRIMARY/COMPREHENSIVE HEALTH CENTRE, ARAKALE | Akure South | 1 |
| SCKYE HOSPITAL, AKURE (-1) | Akure South | 17 |
| SIMLON MEDICAL CENTER, LAFE WAY, AKURE | Akure South | 2 |
| STATE SPECIALIST HOSPITAL IKARE-AKOKO | Akoko North East | 1 |
| STATE SPECIALIST HOSPITAL ONDO | Ondo West | 6 |
| STATE SPECIALIST HOSPITAL, OKE-ARO,AKURE | Akure South | 17 |
| STATE SPECIALIST HOSPITAL, OKITIPUPA | Okitipupa | 4 |
| TOPTARI MEDICALS  AGADAGBA-OBON | Ese Odo | 2 |
| UNIMEDTHC LAJE ROAD,ONDO | Ondo West | 4 |

## Source Exclusion Lists

The following detailed files list every source row individually, including facility, LGA, workbook filename, source row, policy number, beneficiary name, gender, and source age status:

| File | Contents |
|---|---|
| `source_duplicate_policy_records.csv` | All 194 source occurrences belonging to the 97 duplicate policy groups |
| `source_missing_gender_records.csv` | All source rows with missing gender |
| `source_blank_age_records.csv` | All source rows with blank age |
| `source_invalid_age_records.csv` | All source rows with invalid age |
| `source_primary_exclusions.csv` | One mutually exclusive exclusion reason per source row |
| `source_facility_summary.csv` | Facility-by-facility primary exclusion and eligible counts |

## Safety Result

All 112,027 eligible source rows now have a populated age in the July database. The remaining 100 NULL ages are individually identified as not found in the supplied archive. No further update is recommended without locating the missing original source workbooks or an explicitly approved authoritative source.