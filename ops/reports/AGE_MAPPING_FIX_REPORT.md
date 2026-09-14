# National Management Information System (NMIS) — Age Mapping Fix Report

**Author**: Manus AI  
**Date**: August 15, 2026  
**Target Environment**: Production (`https://odchcnmis.online`)  

---

## Executive Summary

Following your observation that the **AI Column Mapping** step was detecting phone numbers but missing age columns, we performed a thorough trace of the enrolment mapping rules (`suggestEnrolmentMappings`). 

The AI mapping weights and keyword dictionary in `enrolmentService.ts` have been enhanced to ensure that incoming workbook columns representing age (including standard variations like `age`, `years`, `yrs`, `dob`, `date of birth`, and `dateofbirth`) are automatically recognized, scored with high confidence, and mapped directly to the NMIS `age` schema field alongside `phoneNumber`.

---

## 1. Mapping Enhancements

- **Keyword Weighting**: Age detection keyword matching was upgraded with weight `1.0` and expanded synonyms (`age`, `years`, `yrs`, `dob`, `date of birth`, `dateofbirth`).
- **UI Integration**: The AI Column Mapping dropdown already exposes **Age** right alongside **Phone Number**, ensuring users can inspect, verify, or manually override the mapped age column before proceeding to provider matching and preview.
- **Persistence & Normalization**: Mapped age values continue to flow through the secure normalization pipeline and are safely persisted into `public.enrollees.age` during import and backfill.

---

## Conclusion

The Age mapping fix is fully implemented, built, committed (`238dba9`), and deployed to Vercel in production. When uploading workbooks, the ingestion engine will now automatically detect and map Age alongside Phone Number.
