# Government Hospital checklist audit notes

## Core structural corrections confirmed from screenshots

- This checklist is **not a scored accreditation checklist**.
- It does **not start with eligibility criteria**.
- It is primarily a **quality assurance / programme monitoring checklist** with:
  - yes/no questions,
  - observed numeric counts,
  - free-text remarks/comments,
  - quarter-linked fields,
  - monthly amount tables,
  - interviewer / QA team details,
  - observations and recommendations.
- The current live Government Hospital implementation is therefore conceptually wrong if it uses:
  - eligibility gate step,
  - points,
  - credentialing/accreditation split scores,
  - recommendation thresholds.

## Evidence from viewed screenshots

### WhatsApp Image 2026-08-20 at 1.38.17 PM.jpeg
- Q11: Did you receive monthly supervisory visits from the TPA? (Ask for supervisory visit report or score)
- Q12: Did you receive quarterly supervisory visits from the ODCHC? (Check for report of last visit)
- Q13: Does your facility provide 24-hour service? (Check facility roster/shift)
- Q14: Total number of staff (skilled and non-skilled) in your health facility
- Q11–Q12 are yes/no with comment fields.
- Q14 is open numeric/response input.

### WhatsApp Image 2026-08-20 at 1.38.19 PM.jpeg
- Q15: Number of health workers by category
- Table-like repeated rows with numeric observation boxes and comment fields.
- Visible categories include:
  - Number of Consultants
  - Number of Medical Doctors
  - Number of Pharmacists
  - Number of Laboratory Scientists
  - Number of Midwives/Nurses
  - Number of Pharmacy Technician
  - Number of Laboratory Technician

### WhatsApp Image 2026-08-20 at 1.38.15 PM.jpeg
- Continuation of Q15 categories:
  - Number of CHEW
  - Number of JCHEW
  - Number of Medical Record Officer
  - Number of Medical Record Technicians
  - Number of Health Attendant/Assistant
  - Number of Security Personnel
  - Others (specify)
- Also visible:
  - Total Number of Beds
- Each row uses an observed number box plus a comment field.

### WhatsApp Image 2026-08-20 at 1.38.16 PM.jpeg
- Q22a: Did you refer ORANGHIS beneficiaries to other facilities?
- Q22b: If yes in Q22a, cases referred to other facilities
- Categories visible under Q22b include:
  - Specialist Consultation
  - Malaria
  - Hypertension
  - Diabetes
- Uses numeric observation boxes plus comment fields.

### WhatsApp Image 2026-08-20 at 1.38.26 PM.jpeg
- Q25 section is expense tracking, quarter-linked, and not scored.
- Visible items:
  - Q25-1: Amount spent on Essential drugs and consumables
  - Q25-2: Amount spent on Maintenance of facilities, laboratory, equipment and transport
  - Q25-3: Amount spent on Human resource development
  - Q25-4: Amount spent on Other things (specify)
- Each Q25 item uses:
  - quarter selector,
  - year input,
  - month / amount / comment table.

### pasted_file_UrHGXz_image.png
- Q24b: If no in Q24a, when last did you receive capitation?
- Q24c: Evidence of capitation received — amounts per month (from Q24a quarter)
- Q25-1 also appears here.
- Q24c uses:
  - quarter selector,
  - year input,
  - month / received? / amount (₦) / comment table.

### pasted_file_fUh2An_image.png
- Q28c: Personnel — Head of Account (name, phone)
- Q28d: Personnel — Head of Pharmacy (name, phone)
- Q28e: Personnel — Head of Scheme (name, phone)
- Section header visible:
  - E — Challenges and Recommendations
- Q29: What are the challenges facing ORANGHIS in your facility?
- Q30: What are your recommendations?

### pasted_file_TnFjSz_image.png and pasted_file_v2r7V1_image.png
- OBS: Please provide details of your observations here
- Interviewer Details section
- Fields visible:
  - Interviewer Name
  - Date
  - QA Team Member 1 — Name
  - QA Team Member 2 — Name
  - QA Team Member 3 — Name
  - QA Team Member 4 — Name

## Interim conclusion

The Government Hospital template should be rebuilt as an **observation-based ORANGHIS quality assurance form**, not as a standard ODCHC accreditation scoring checklist.

## Likely implementation implications

- No score computation.
- No score cards.
- No credentialing/accreditation split.
- No recommendation thresholds.
- No eligibility step.
- Need support for repeated row groups, quarterly data capture, monthly amount grids, observer notes, and interviewer details.
- Likely needs its own workflow distinct from Pharmacy / Private Hospital accreditation.

## Additional confirmed structure from the unzipped completed checklist

### True beginning of the checklist

#### WhatsApp Image 2026-08-20 at 1.38.27 PM.jpeg
This confirms the checklist starts with **Section A — General Requirements / Facility Profile**, not eligibility criteria.

Visible fields:
- Reference Quarter & Year (applies to all questions)
- Name of Facility
- Address of Facility / Location
- Local Government / Senatorial District
- Facility Email
- Is your facility accredited by NHIA? (Yes / No + Registration Number)

This is a profile and contextual data section, not a scored eligibility gate.

### Section A continuation

#### WhatsApp Image 2026-08-20 at 1.38.24 PM.jpeg
Visible items under the same general pre-programme section include:
- Q08: When last did the Health Facility Management Committee meet? (Check for minutes/attendance)
- Q09: Is there a dedicated officer responsible for ORANGHIS in the facility?
- Q10: Name of desk officer
- Q10b: Phone number of desk officer
- Q11: Did you receive monthly supervisory visits from the TPA?

Q08 uses a response field linked to the reference quarter. Q09 and Q11 use yes/no plus comments. Q10 and Q10b are open text inputs.

### Section B header and focus

#### WhatsApp Image 2026-08-20 at 1.38.29 PM.jpeg
This confirms the next major section is:

> **B — Drug Management System (Q18)**

This means the earlier personnel-count area is part of the pre-Q18 section and should not be converted into a score-based accreditation personnel block.

### Section B visible items

#### WhatsApp Image 2026-08-20 at 1.38.30 PM.jpeg
Visible Q18 items include:
- Q18-5a: If yes, what does facility do?
- Q18-6: Adequate drug storage with A/C
- Q18-7: Assess the drug store for labelling
- Q18-8: Amount budgeted for drugs per month/quarter (record the figure)
- Q19: How much did you generate apart from ORANGHIS fund?

This section mixes yes/no checks, text answers, and amount fields.

### Section C and D headers confirmed

#### WhatsApp Image 2026-08-20 at 1.38.28 PM.jpeg
Visible content confirms:
- Q23-infra7: Physical Infrastructure — Are the toilets clean?
- Q23-infra8: Physical Infrastructure — Is the hospital environment clean/grass well cut?
- Next section header: **D — Financial Management**
- Q24a: Did you receive capitation from ODCHC?
- Q24b: If no in Q24a, when last did you receive capitation?

This confirms the checklist is organised around programme-assurance themes, not accreditation score sections.

## Revised conceptual conclusion

The Government Hospital workflow should be rebuilt as a **multi-section ORANGHIS quality assurance form** with these structural characteristics:

1. **Section A — General Requirements / Facility Profile**
2. A pre-Q18 operational / staffing block that records observed numbers and remarks
3. **Section B — Drug Management System (Q18)**
4. **Section C — Programme Implementation**
5. **Section D — Financial Management**
6. **Section E — Challenges and Recommendations**
7. **Observations**
8. **Interviewer Details / QA Team Members**

It should not use the standard accreditation pattern of Eligibility -> Personnel -> Infrastructure -> Services -> Review & Sign with scoring.
