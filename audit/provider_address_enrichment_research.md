# Provider Address Enrichment Research

## Database audit

The active NMIS provider directory currently contains 106 active providers. Of these, 26 have a usable address, 80 have a null, blank, or restricted address, and 18 have missing latitude/longitude. Coordinates are currently present for 88 providers, but many are broad LGA/city centroids rather than facility-specific points, so they must not be treated as precise facility locations without verification.

## Verified public sources reviewed

1. **Ondo State Ministry of Health — Secondary Facilities**: https://ondostatemoh.gov.ng/hospital!list.php?hosptype=Secondary
   - State Specialist Hospital Ikare Akoko — Ikare SSH Hospital Road, Akoko North East.
   - State Specialist Hospital Oke-Aro, Akure — Old Mother and Child Hospital, Oke Aro, Akure, Akure South.
   - State Specialist Hospital Okitipupa — Okitipupa SSH, Okitipupa.

2. **Federal Medical Centre Owo official contact page**: https://fmcowo.org.ng/contact.html
   - Federal Medical Centre, Owo — Adekunle Ajasin Road, Owo, Ondo State, Nigeria.

3. **Netcare Multispecialty Hospital official contact page**: https://netcarehospital.ng/contact/
   - Netcare Multispecialty Hospital — 10 Owo Avenue, opposite Royal Birds Hotel, Ijapo, Akure, Ondo State.

4. **Waze facility listing**: https://www.waze.com/live-map/directions/ng/nd/akure/sijuwade-specialist-hospital?to=place.ChIJXUGEm2CFRxARTR6mzCKlUFY
   - Sijuwade Specialist Hospital — Sijuade Road, Akure 340283, Ondo, Nigeria.
   - Listing coordinates in the page metadata: approximately 7.2319079, 5.2051096.

5. **St. Michael's Hospital LinkedIn company page**: https://ng.linkedin.com/company/st-michael-s-hospital-nigeria
   - St. Michael's Hospital — 40 Danjuma Street, Akure, Ondo State, Nigeria.

6. **Mother and Child Hospital public directory page**: https://babymigo.com/ondo/mother-and-child-hospital-akure
   - Mother and Child Hospital, Akure — Fadaka Street, Oke Aro, Akure, Ondo, Nigeria. This exact facility name was not yet matched to an active NMIS provider row during this audit and should not be written until matched.

7. **TheHospitalBook**: https://thehospitalbook.com/state-specialist-hospital-ikare/ and https://thehospitalbook.com/ore-general-hospital/
   - State Specialist Hospital Ikare — Ilepa 2, Akoko North East, Ondo, Nigeria.
   - Ore General Hospital — Ore 1, Odigbo, Ondo State.
   - These are useful corroborating public listings but are not official government pages; use them only as secondary evidence.

## Safety conclusion

Only exact name matches with reliable evidence should be written to production. LGA centroids, town names, guessed street names, or search-result snippets must not be promoted to exact facility addresses. The future provider-registration/import contract should require address, latitude, longitude, address source, verification status, and verification date, with an explicit `UNVERIFIED` state that disables precise navigation until confirmed.
