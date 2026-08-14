import {
  EnrolleeRecord,
  EnrolmentCategory,
  EnrolmentSector,
  EnrolmentColumnMapping,
  EnrolmentField,
} from '../../types/enrolment/enrolmentTypes';
import { ProviderMatch } from '../../types/financial-data';
import {
  fetchEnrolleeById,
  fetchEnrollees,
  fetchEnrolmentAnalytics,
  fetchEnrolmentAnalyticsWithFinance,
  fetchProviderPopulationSummary,
  insertEnrolleeRecords,
  createEnrolmentImportBatch,
  checkDuplicateEnrolmentBatch,
} from '../../repositories/enrolment/enrolmentRepository';

const normalizeText = (value: unknown) => String(value ?? '').trim();

const mappingRules: Array<{ field: EnrolmentField | 'ignored'; keywords: string[]; weight: number }> = [
  { field: 'ignored', keywords: ['s/n', 'sn', 'index', 'id', 'account number', 'bank', 'amount', 'capitation fee'], weight: 1.0 },
  { field: 'policyNumber', keywords: ['policy number', 'policy no', 'policy', 'membership number', 'member id', 'enrollee id'], weight: 1.0 },
  { field: 'category', keywords: ['category', 'beneficiary category', 'member category', 'principal/dependant'], weight: 1.0 },
  { field: 'firstName', keywords: ['first name', 'firstname', 'given name', 'other names'], weight: 0.9 },
  { field: 'lastName', keywords: ['last name', 'lastname', 'surname', 'family name'], weight: 0.9 },
  { field: 'gender', keywords: ['gender', 'sex'], weight: 0.8 },
  { field: 'age', keywords: ['age', 'years', 'dob', 'date of birth'], weight: 0.9 },
  { field: 'phoneNumber', keywords: ['phone', 'telephone', 'mobile', 'phone number'], weight: 0.8 },
  { field: 'providerCode', keywords: ['provider code', 'facility code', 'facility id', 'provider id', 'hcp code'], weight: 0.9 },
  { field: 'providerName', keywords: ['provider', 'facility', 'hospital', 'health facility', 'facility name', 'name of facility', 'account name as it appears'], weight: 1.0 },
  { field: 'lga', keywords: ['lga', 'local government', 'local govt', 'area'], weight: 0.7 },
  { field: 'state', keywords: ['state', 'region', 'location'], weight: 0.7 },
  { field: 'senatorialDistrict', keywords: ['senatorial', 'senate district', 'district'], weight: 0.7 },
  { field: 'reportingMonth', keywords: ['month', 'reporting month', 'period'], weight: 0.8 },
  { field: 'reportingYear', keywords: ['year', 'reporting year'], weight: 0.8 },
];

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseMonth(value: unknown): number | undefined {
  const text = normalizeText(value).toLowerCase();
  const numeric = Number(text);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric;
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const index = months.findIndex(month => month === text || month.slice(0, 3) === text);
  return index >= 0 ? index + 1 : undefined;
}

function parseYear(value: unknown): number | undefined {
  const parsed = Number(normalizeText(value));
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : undefined;
}

function readMappedValue(row: Record<string, unknown>, mappings: EnrolmentColumnMapping[], field: EnrolmentField): unknown {
  const mapping = mappings.find(item => item.enrolmentField === field);
  return mapping ? row[mapping.excelField] : undefined;
}

export function deriveSectorFromPolicy(policyNumber: string): EnrolmentSector | undefined {
  const normalized = policyNumber.replace(/\s+/g, '').toUpperCase();
  if (/\/C(?:\/|$)/.test(normalized)) return 'formal';
  if (/\/D(?:\/|$)/.test(normalized)) return 'informal';
  return undefined;
}

export function normalizeEnrolmentCategory(value: unknown): EnrolmentCategory | undefined {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'principal' || normalized === 'p' || normalized === 'subscriber') return 'principal';
  if (normalized === 'dependant' || normalized === 'dependent' || normalized === 'd') return 'dependant';
  return undefined;
}

/**
 * Suggest enrolment mappings using fuzzy AI-like logic
 */
export function extractWorkbookContext(matrix: unknown[][]): { facilityName?: string; lga?: string; period?: string } {
  let facilityName: string | undefined;
  let lga: string | undefined;
  let period: string | undefined;

  // Scan top 6 rows before column headers for metadata
  for (let i = 0; i < Math.min(matrix.length, 6); i++) {
    const row = matrix[i];
    if (!row) continue;
    const rowText = row.map(cell => String(cell ?? '').trim()).filter(Boolean).join(' ');
    const upper = rowText.toUpperCase();

    // Detect LGA
    if (upper.includes('LOCAL GOVERNMENT') || upper.includes('LGA')) {
      const lgaMatch = rowText.match(/([A-Z\s]+(?:LOCAL GOVERNMENT|LGA))/i);
      if (lgaMatch) {
        lga = lgaMatch[1].replace(/LOCAL GOVERNMENT|LGA/gi, '').trim();
      } else {
        // common LGAs in Ondo
        const lgas = ['AKOKO NORTH EAST', 'AKOKO NORTH WEST', 'AKOKO SOUTH AKURE', 'AKOKO SOUTH EAST', 'AKOKO SOUTH WEST', 'AKURE SOUTH', 'AKURE NORTH', 'IDANRE', 'ODIGBO', 'OKITIPUPA', 'ILE OLUJI', 'IFE', 'OWO', 'OJEBU'];
        for (const l of lgas) {
          if (upper.includes(l)) {
            lga = l;
            break;
          }
        }
      }
    }

    // Detect Facility Name (contains Hospital, Clinic, Medical, Healthcare, Health Center)
    if (upper.includes('HOSPITAL') || upper.includes('CLINIC') || upper.includes('MEDICAL') || upper.includes('HEALTH CENTER') || upper.includes('HEALTH CENTRE')) {
      for (const cell of row) {
        const text = String(cell ?? '').trim();
        const uText = text.toUpperCase();
        if (uText.length > 5 && (uText.includes('HOSPITAL') || uText.includes('CLINIC') || uText.includes('MEDICAL') || uText.includes('CENTER') || uText.includes('CENTRE'))) {
          facilityName = text.replace(/^["']|["']$/g, '').trim();
          break;
        }
      }
    }

    // Detect Period / Month / Year
    if (upper.includes('JULY') || upper.includes('JANUARY') || upper.includes('FEBRUARY') || upper.includes('MARCH') || upper.includes('APRIL') || upper.includes('MAY') || upper.includes('JUNE') || upper.includes('AUGUST') || upper.includes('SEPTEMBER') || upper.includes('OCTOBER') || upper.includes('NOVEMBER') || upper.includes('DECEMBER')) {
      const yearMatch = rowText.match(/20\d\d/);
      if (yearMatch) {
        period = yearMatch[0];
      }
    }
  }

  return { facilityName, lga, period };
}

export function suggestEnrolmentMappings(headers: string[]): EnrolmentColumnMapping[] {
  return headers.map(header => {
    const normalized = normalizeHeader(header).replace(/[^a-z0-9/ ]/g, '');
    let bestMatch: EnrolmentField | 'ignored' = 'ignored';
    let maxScore = 0;

    for (const rule of mappingRules) {
      for (const kw of rule.keywords) {
        let score = 0;
        if (normalized === kw) score = 1.0;
        else if (normalized.startsWith(kw) || normalized.endsWith(kw)) score = 0.85;
        else if (normalized.includes(kw)) score = 0.7;
        
        score *= rule.weight;
        if (score > maxScore) {
          maxScore = score;
          bestMatch = rule.field as EnrolmentField | 'ignored';
        }
      }
    }

    return {
      excelField: header,
      enrolmentField: bestMatch,
      confidence: maxScore > 0.9 ? 'HIGH' : maxScore > 0.6 ? 'MEDIUM' : 'LOW',
      confidenceScore: maxScore,
    };
  });
}

export function normalizeGender(value: unknown): EnrolleeRecord['gender'] | undefined {
  const normalized = normalizeText(value).toLowerCase();
  if (['male', 'm', 'boy', 'man'].includes(normalized)) return 'male';
  if (['female', 'f', 'girl', 'woman'].includes(normalized)) return 'female';
  if (normalized) return 'other';
  return undefined;
}

export function buildEnrolleeFingerprint(policyNumber: string, period: string): string {
  return `${policyNumber.replace(/\s+/g, '').toLowerCase()}|${period.trim()}`;
}

const isSummaryRow = (providerName: string): boolean => {
  const normalized = providerName.trim().toUpperCase();
  return (
    normalized === 'TOTAL' ||
    normalized === 'GRAND TOTAL' ||
    normalized === 'SUBTOTAL' ||
    normalized.startsWith('TOTAL ') ||
    normalized.startsWith('GRAND TOTAL ') ||
    normalized.startsWith('SUBTOTAL ')
  );
};

/**
 * Smart normalization for enrolment values (standardizing ownership and categories)
 */
export function smartNormalizeEnrolmentValue(field: EnrolmentField | 'ownership', value: unknown): any {
  if (value === null || value === undefined) return value;
  const text = String(value).trim();
  const upper = text.toUpperCase();

  if (field === 'category') {
    if (upper.includes('PRINCIPAL') || upper === 'P' || upper === 'S') return 'principal';
    if (upper.includes('DEPEND') || upper === 'D') return 'dependant';
    return 'principal';
  }

  if (field === 'ownership') {
    if (upper.includes('PRVATE') || upper.includes('PRIVATE')) return 'Private';
    if (upper.includes('GOV') || upper.includes('PUBLIC')) return 'Government';
    return 'Private'; // Default fallback
  }

  if (field === 'state') {
    return 'Ondo';
  }

  if (field === 'gender') {
    if (['MALE', 'M', 'BOY', 'MAN'].includes(upper)) return 'male';
    if (['FEMALE', 'F', 'GIRL', 'WOMAN'].includes(upper)) return 'female';
    return 'other';
  }

  return text;
}

export function normalizeEnrolmentRows(
  rows: Array<Record<string, unknown>>,
  mappings: EnrolmentColumnMapping[],
  matches: ProviderMatch[],
  period: string,
  batchId: string,
  fileName: string,
  sourceSheet?: string,
): EnrolleeRecord[] {
  const matchByName = new Map(matches.map(match => [match.excelName.trim().toLowerCase(), match]));
  const [periodYear, periodMonth] = period.split('-').map(Number);

  const fallbackMatch = matches[0];

  const normalized = rows.filter(row => {
    const sourceProviderName = normalizeText(readMappedValue(row, mappings, 'providerName')) || (fallbackMatch ? fallbackMatch.excelName : '');
    return sourceProviderName && !isSummaryRow(sourceProviderName);
  }).map((row, index) => {
    const policyNumber = normalizeText(readMappedValue(row, mappings, 'policyNumber')).toUpperCase().replace(/\s+/g, '');
    const category = normalizeEnrolmentCategory(readMappedValue(row, mappings, 'category'));
    const sector = deriveSectorFromPolicy(policyNumber);
    const firstName = normalizeText(readMappedValue(row, mappings, 'firstName'));
    const lastName = normalizeText(readMappedValue(row, mappings, 'lastName'));
    const gender = normalizeGender(readMappedValue(row, mappings, 'gender'));
    const rawAge = readMappedValue(row, mappings, 'age');
    const age = rawAge !== undefined && rawAge !== '' ? Number(rawAge) : undefined;
    
    const sourceProviderName = normalizeText(readMappedValue(row, mappings, 'providerName')) || (fallbackMatch ? fallbackMatch.excelName : '');
    const sourceProviderCode = normalizeText(readMappedValue(row, mappings, 'providerCode'));
    const sourceLga = normalizeText(readMappedValue(row, mappings, 'lga'));
    const sourceState = normalizeText(readMappedValue(row, mappings, 'state'));
    
    const match = matchByName.get(sourceProviderName.toLowerCase()) || fallbackMatch;
    const errors: string[] = [];

    if (!policyNumber) errors.push('Policy number is required.');
    if (!category) errors.push('CATEGORY must be PRINCIPAL or DEPENDANT.');
    if (!sector) errors.push('Policy number must contain /C/ for formal or /D/ for informal sector.');
    if (!firstName) errors.push('First name is required.');
    if (!lastName) errors.push('Last name is required.');
    if (!gender) errors.push('Gender is required.');
    if (!sourceProviderName) errors.push('Facility/provider name is required.');
    if (!periodYear || !periodMonth) errors.push('A valid reporting period is required.');
    if (!match || match.status !== 'confirmed' || !match.matchedProviderId) errors.push(match?.status === 'pending' ? 'Facility match requires manual review.' : 'Facility could not be matched to the Provider Directory.');

    const providerName = match?.matchedProviderName || sourceProviderName;
    const providerCode = match?.matchedProviderCode || sourceProviderCode;
    const providerLga = match?.matchedProviderLga || sourceLga;
    const providerState = match?.matchedProviderState || sourceState;
    const providerSenatorialDistrict = match?.matchedProviderSenatorialDistrict || normalizeText(readMappedValue(row, mappings, 'senatorialDistrict')) || undefined;
    
    // Ownership normalization from match or source
    const rawOwnership = match?.matchedProviderOwnership || (row['ownership'] || row['OWNERSHIP'] || row['Ownership']);
    const ownership = smartNormalizeEnrolmentValue('ownership', rawOwnership);

    const recordStatus = errors.length > 0
      ? (match && match.status !== 'confirmed' ? 'match-review-required' : 'error')
      : 'valid';
    const record: EnrolleeRecord = {
      id: `enrollee-${batchId}-${index + 1}`,
      policyNumber,
      category: category || 'principal',
      sector: sector || 'formal',
      firstName,
      lastName,
      gender: gender || 'other',
      age: Number.isInteger(age) ? age : undefined,
      phoneNumber: normalizeText(readMappedValue(row, mappings, 'phoneNumber')) || undefined,
      providerId: match?.matchedProviderId,
      providerCode: providerCode || undefined,
      providerName,
      facilityType: match?.matchedProviderFacilityType,
      ownership: ownership as any,
      lga: providerLga,
      state: providerState,
      senatorialDistrict: providerSenatorialDistrict,
      reportingYear: parseYear(readMappedValue(row, mappings, 'reportingYear')) || periodYear || 0,
      reportingMonth: parseMonth(readMappedValue(row, mappings, 'reportingMonth')) || periodMonth || 0,
      period,
      sourceFile: fileName,
      importBatchId: batchId,
      sourceRow: index + 2,
      recordStatus,
      validationErrors: errors.length > 0 ? errors : undefined,
      fingerprint: buildEnrolleeFingerprint(policyNumber, period),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        sourceSheet,
        sourceCategory: normalizeText(readMappedValue(row, mappings, 'category')),
        sourceProviderName,
        sourceProviderCode,
        sourceLga,
        sourceState,
        sourceSenatorialDistrict: normalizeText(readMappedValue(row, mappings, 'senatorialDistrict')) || undefined,
        authoritativeProviderId: match?.matchedProviderId,
        authoritativeProviderLga: match?.matchedProviderLga,
        authoritativeProviderState: match?.matchedProviderState,
        authoritativeProviderSenatorialDistrict: match?.matchedProviderSenatorialDistrict,
        matchType: match?.matchType || 'none',
        matchStatus: match?.status || 'pending',
      },
    };

    return record;
  });

  return markDuplicateEnrollees(normalized);
}

export function markDuplicateEnrollees(records: EnrolleeRecord[]): EnrolleeRecord[] {
  const seen = new Set<string>();
  return records.map(record => {
    const fingerprint = record.fingerprint || buildEnrolleeFingerprint(record.policyNumber, record.period);
    const duplicate = seen.has(fingerprint);
    seen.add(fingerprint);
    return duplicate
      ? { ...record, fingerprint, recordStatus: 'duplicate' }
      : { ...record, fingerprint };
  });
}

export const enrolmentService = {
  deriveSectorFromPolicy,
  normalizeEnrolmentCategory,
  normalizeGender,
  buildEnrolleeFingerprint,
  extractWorkbookContext,
  suggestEnrolmentMappings,
  normalizeEnrolmentRows,
  markDuplicateEnrollees,
  fetchEnrollees,
  fetchEnrolleeById,
  fetchEnrolmentAnalytics,
  fetchEnrolmentAnalyticsWithFinance,
  fetchProviderPopulationSummary,
  insertEnrolleeRecords,
  createEnrolmentImportBatch,
  checkDuplicateEnrolmentBatch,
  smartNormalizeEnrolmentValue,
};
