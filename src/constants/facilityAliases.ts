export type FacilityAlias = {
  accountName: string;
  siteName: string;
};

/**
 * Matching-only aliases for imported facility/account names.
 *
 * These values must not replace the official provider/facility name in the
 * directory, reports, or persisted records. They are used only to expand
 * candidate matching when an account name differs from the registered site
 * name.
 */
export const FACILITY_NAME_ALIASES: readonly FacilityAlias[] = [
  { accountName: 'ONDO STATE COLLEGE OF HEALTH TECHNOLOGY CLINIC REVENUE ACCOUNT', siteName: 'COLLEGE OF HEALTH TECHNOLOGY CLINIC, ODA ROAD, AKURE' },
  { accountName: 'ADULOJU HOSPITAL,AKUNGBA', siteName: 'ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO' },
  { accountName: 'AKINTAN MEMORIAL HOSPITAL', siteName: 'AKINTAN MEMORIAL HOSPITAL, OKE-IJEBU AKURE' },
  { accountName: 'REMITA FUND HOLDING ACCOUNT FMC OWO', siteName: 'FEDERAL MEDICAL CENTRE OWO' },
  { accountName: 'DELIGHT SPECIALIST CLINIC AND MATERNITY', siteName: 'DELIGHT SPECIALIST CLINICS AND MATERNITY AKURE' },
  { accountName: 'TOPTARI MEDICALS', siteName: 'TOPTARI MEDICALS AGADAGBA-OBON' },
  { accountName: 'COMPREHENSIVE HEALTH CENTRE OWASE AKOKO (BASIC HEALTH CARE PROVISION FUND)', siteName: 'PRIMARY/COMPREHENSIVE HEALTH CENTRE, OWASE OKA' },
  { accountName: 'OKEIGBO CHC ORANGE HEALTH INSURANCE SCHEME', siteName: 'COMPREHENSIVE HEALTH CENTRE,OKEIGBO' },
  { accountName: 'ILAJE BASIC HEALTH CARE PROVISION FUND PROVISION FUND PRIMARY HEALTH CLINIC,ZION PEPE', siteName: 'COMPREHENSIVE HEALTH CENTRE ZION PEPE' },
  { accountName: 'CHRISTBAY CONSULTANT HOSPITAL AKURE', siteName: 'CHRISTBAY CONSULTANTS HOPITAL,AKURE' },
  { accountName: 'ETON CLINIC OBAILE AKURE', siteName: 'ETON MEDICALS, OBA-ILE AKURE' },
  { accountName: 'FIRST MERCY SPECIALIST HOSPITAL AKURE', siteName: 'FIRST MERCY SPECIALIST HOSPITAL AKURE' },
  { accountName: 'ONDO STATE GENERAL HOSPITAL ARAROMI-OBU REVENUE ACCOUNT', siteName: 'GENERAL HOSPITAL, ARAROMI-OBU' },
  { accountName: 'GENERAL HOSPITAL BOLORUNDURO', siteName: 'GENERAL HOSPITAL BOLORUNDURO' },
  { accountName: 'GENERAL HOSPITAL IDO-ANI', siteName: 'GENERAL HOSPITAL IDO-ANI' },
  { accountName: 'GENERAL HOSPITAL IFON (ODCHC) ACCOUNT', siteName: 'GENERAL HOSPITAL IFON' },
  { accountName: 'STATE SPECIALIST HOSPITAL IGBARA-OKE (ODCHC) ACCOUNT', siteName: 'GENERAL HOSPITAL IGBARA-OKE' },
  { accountName: 'ODCHC GENERAL HOSPITAL IGBEKEBO', siteName: 'GENERAL HOSPITAL IGBEKEBO' },
  { accountName: 'GENERAL HOSPITAL IGBOKODA (ODCHC) ACCOUNT', siteName: 'GENERAL HOSPITAL IGBOKODA' },
  { accountName: 'J&E FATULA HOSPITAL OKEARO AKURE', siteName: 'J&E FATUNLA HOSPITAL OKEARO AKURE' },
  { accountName: 'ONDO ST.REF.HOSP.-ORANGHIS', siteName: 'ONDO STATE REFERENCE HOSPITAL, IGBATORO ROAD AKURE' },
  { accountName: 'NETCARE MULTISPECIALIST HOSPITAL IJAPO', siteName: 'NETCARE MULTISPECIALTY HOSPITAL, AKURE' },
  { accountName: 'DEONEWDAY INTEGRATEDMEDICALSERVICES LTD', siteName: 'NEWDAY MEDICAL CENTER, IJAPO, AKURE' },
  { accountName: 'DEBORAH MULTI SPECIALIST  HOS  AND DIAGNOSTICS CENTER', siteName: 'DEBORAH MULTI-SPECIALIST HOSPITAL & DIAGNOSTIC CENTRE' },
  { accountName: 'PRIMARY HEALTH CENTRE OKE-ALAFIA', siteName: 'PRIMARY HEALTH CENTRE OKE-ALAFIA ILE-OLUJI' },
  { accountName: 'PRIMARY HEALTH CENTRE PANAPANA ORE', siteName: 'PRIMARY HEALTH CENTRE, PANAPANA ORE' },
  { accountName: 'STATE SPECIALIST HOSPITAL (ODCHC) ACCOUNT OKE-ARO', siteName: 'STATE SPECIALIST HOSPITAL, OKE-ARO,AKURE' },
  { accountName: 'ST MICHAEL HOSPITAL DANJUMA AKURE', siteName: 'ST MICHAEL HOSPITAL, AKURE' },
  { accountName: 'STATE SPECIALIST HOSPITAL,AKURE REVENUE ACCOUNT', siteName: 'FUTA TEACHING HOSPITAL (UNIMEDTHC), AKURE' },
  { accountName: 'STATE SPECIALIST HOSPITAL NHIS', siteName: 'STATE SPECIALIST HOSPITAL ONDO' },
  { accountName: 'UNIVERSITY OF MEDICAL SCIENCES TEACHING HOSPITAL', siteName: 'UNIMEDTHC LAJE ROAD,ONDO' },
  { accountName: 'GOODIES HOSPITAL ONDO', siteName: 'GOODIES HOSPITAL & DIAGNOSTICS LTD ONDO' },
  { accountName: 'OMOLOLU HOSPITAL', siteName: 'OMOLOLU MEDICAL CENTRE,AKURE' },
  { accountName: 'KINGS MEDIC ROYAL CLINIC, ODA ROAD, AKURE', siteName: 'KINGS MEDI-CLINIC AKURE' },
  { accountName: 'TOTAL CARE MEDICAL CLINIC, UGBE AKOKO', siteName: 'TOTAL CARE MEDICAL CENTRE UGBE- AKOKO' },
  { accountName: 'AKURE ANGLICAN DIOCESE MEDICAL CENTER, AKURE', siteName: 'AKURE ANGLICAN DIOC. MED. CENTER ANGLICAN COMMUNITY, AKURE' },
  { accountName: 'FIRST DIAMOND MEDICAL SERVICES LIMITED', siteName: 'DIAMOND MEDICAL CLINIC, IKARE AKOKO' },
  { accountName: 'GREAT REDEEMER HOSPITAL AND MS', siteName: 'REDEEMERS HOSPITAL,IGBOKODA' },
  { accountName: 'WESTPOINT MEDICAL', siteName: 'WESTPOINT HOSPITAL, OKITIPUPA' },
  { accountName: 'TOP PEACE NIGERIA LTD', siteName: 'TOPTARI MEDICALS AGADAGBA-OBON' },
  { accountName: 'LIFECARE HOSPITAL LIMITED', siteName: 'LIFECARE HOSPITAL, ODIGBO' },
  { accountName: 'KAYMAS MEDICAL CENTRE KAYMAS 2', siteName: 'KAYMAS MEDICAL CENTRE' },
  { accountName: 'OLATUNDE MEMORIAL EL-SHADOLA SPECIALIST HOSPITAL LTD', siteName: 'EL-SHADDAI SPECIALIST HOSPITAL, AKURE' },
  { accountName: 'AGROMEDICAL COMPLEX LTD (FOUNTAIN HOSP.)', siteName: 'FOUNTAIN SPECIALIST HOSPITAL,OBA-ILE AKURE' },
  { accountName: 'MIDAS HOSPITAL LIMITED', siteName: 'MIDAS HOSPITAL OKE-IJEBU, AKURE' },
  { accountName: 'CHC OBAILE BHC PROV FUND ACCT', siteName: 'PRIMARY HEALTH CENTRE OBAILE' },
];

export function normalizeFacilityMatchName(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function getFacilityMatchingNames(input: string): string[] {
  const normalizedInput = normalizeFacilityMatchName(input);
  const names = new Map<string, string>();
  const add = (value: string) => {
    const normalized = normalizeFacilityMatchName(value);
    if (normalized && !names.has(normalized)) names.set(normalized, value);
  };

  add(input);
  FACILITY_NAME_ALIASES.forEach(({ accountName, siteName }) => {
    if (normalizeFacilityMatchName(accountName) === normalizedInput || normalizeFacilityMatchName(siteName) === normalizedInput) {
      add(accountName);
      add(siteName);
    }
  });

  return [...names.values()];
}

