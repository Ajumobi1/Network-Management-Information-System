# Government Hospital QA — Section C extraction notes

## Source set
Extracted from the following images in `/home/ubuntu/section_c_images/`:
- `WhatsApp Image 2026-08-21 at 9.53.00 AM.jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.00 AM (1).jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.00 AM (2).jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.00 AM (3).jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.01 AM.jpeg`

## Confirmed section identity
The screenshot heading reads:
- `C — PROGRAMME IMPLEMENTATION`

This means the current authoritative Section C is **Programme Implementation**.
The previously created Drug Management section should not remain as Section C if this new source is authoritative.

## Confirmed items and layout

### Q020
- Label: `Does your facility have the ODCHC workplan?`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q021a
- Label: `Number of referrals for secondary services by your facility`
- Extra label: `Quarter: (select quarter)`
- Input: open text / response field

### Q021b
- Label: `Number of referrals to SHF approved for your facility`
- Extra label: `Quarter: (select quarter)`
- Input: open text / response field

### Q021c
- Label: `Did you refer ORANGHIS beneficiaries to SHC facility?`
- Extra label: `Quarter: (select quarter)`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q021d
- Label: `If yes in Q021c, number of cases referred to ODCHC accredited facilities`
- Layout: table with columns `Category` and `No.` plus a `Comment...` field under each category row
- Confirmed categories from viewed images:
  1. `Specialist Consultation`
  2. `Malaria`
  3. `Hypertension`
  4. `Diabetes`
  5. `Delivery`
  6. `Surgery`
  7. `HIV/AIDS & STD Treatment`
  8. `Mental Health Management`
  9. `Diagnostics`
  10. `Optical`
  11. `Dental`
  12. `Pharmacy`
  13. `Diseases of public health concern (TB, Leprosy etc)`
  14. `Others (specify)`

### Q022a
- Label: `Did you refer ORANGHIS beneficiaries to other facilities?`
- Extra label: `Quarter: (select quarter)`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q022b
- Label: `If yes in Q022a, cases referred to other facilities`
- Layout appears to mirror Q021d with the same category/count/comment table.
- Confirmed visible categories so far:
  1. `Specialist Consultation`
  2. `Malaria`
  3. `Hypertension`
  4. `Diabetes`
  5. `Delivery`
  6. `Surgery`
  7. `HIV/AIDS & STD Treatment`
  8. `Mental Health Management`
- Remaining rows likely continue below in later images and still need confirmation.

## Important implementation notes
- Quarter-dependent labels must use the selected reference quarter from Section A.
- Q021d and Q022b are not single text fields; they are structured repeated rows with count + comment per category.
- Q021d should display only when Q021c = Yes.
- Q022b should display only when Q022a = Yes.
- The current earlier Section C `Drug Management System` may need to be renamed/reordered if these Programme Implementation images are the authoritative Section C.
- No scoring; all are QA observation inputs only.

## Open items pending next images
- Full bottom half of Q022b categories
- Whether more questions follow after Q022b in the remaining images
- Whether Drug Management should become Section D instead of Section C


## Additional confirmed items from later images
Extracted from:
- `WhatsApp Image 2026-08-21 at 9.53.02 AM.jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.02 AM (1).jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.03 AM.jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.04 AM.jpeg`
- `WhatsApp Image 2026-08-21 at 9.53.04 AM (1).jpeg`

### Q022b continuation
Confirmed that Q022b mirrors Q021d with the same category/count/comment structure. Additional confirmed visible categories:
- `Diagnostics`
- `Optical`
- `Dental`
- `Pharmacy`
- `Diseases of public health concern (TB, Leprosy etc)`
- `Others (specify)`

### Q023-stock1
- Label: `Number of times: Stock out of any of the essential drugs`
- Extra label: `Quarter: (select quarter)`
- Input: open text / response field

### Q023-stock2
- Label: `Number of times: Stock out of laboratory commodities and other consumables`
- Extra label: `Quarter: (select quarter)`
- Input: open text / response field

### Q023-infra1
- Label: `Physical Infrastructure — Adequate water supply`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q023-infra2
- Label: `Physical Infrastructure — Efficient power supply`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q023-infra3
- Label: `Physical Infrastructure — Is the consultation room clean?`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q023-infra4
- Label: `Physical Infrastructure — Are the wards clean and well ventilated?`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q023-infra5
- Label: `Physical Infrastructure — Are the wards adequately illuminated?`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q023-infra6
- Label: `Physical Infrastructure — Are there mosquito screens on windows or bed nets?`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q023-infra7
- Label: `Physical Infrastructure — Are the toilets clean?`
- Input: Yes / No toggle
- Extra field: `Comment`

### Q023-infra8
- Label: `Physical Infrastructure — Is the hospital environment clean/grass well cut?`
- Input: Yes / No toggle
- Extra field: `Comment`

## Updated structure conclusion
The authoritative screenshots show that **Section C — Programme Implementation** is broader than the earlier temporary Drug Management section. It contains referral, stock-out, and physical infrastructure items in the same section flow.

Open items still pending from the remaining unseen images:
- Any Section C items after `Q023-infra8`
- Whether there are more `Q023-infra*` rows
- Whether a new section begins after these rows

