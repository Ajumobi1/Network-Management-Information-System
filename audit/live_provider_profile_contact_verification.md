# Live Provider Profile Verification

Date: 2026-08-18 UTC

Authenticated production session: `https://www.odchcnmis.online`

Provider verified: ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO (`PROV-553589`)

## Facility Details tab

The live profile displays:

- Facility Type: Hospital
- Address: 70, Iwaro Road, Akungba Akoko, Ondo State
- Staff Strength: 0
- Services: 0
- Departments: 0
- Equipment: 0

This confirms that the previous hardcoded `Access restricted` address is no longer displayed for the Facility Details tab.

## Profile navigation

The profile route opened successfully from the Provider Directory without a blank screen or redirect. The Contacts tab remains to be verified in the next browser interaction.

## Contacts tab

The live Contacts tab displays:

- Contact Person: Pending verification
- Phone: +2349158203566
- Email: admin@adulojuhospital.com

This confirms the repository/RPC mapping fix is live and real phone/email values are reaching the provider profile. The contact-person field is still legitimately marked `Pending verification` for this facility rather than being fabricated.
