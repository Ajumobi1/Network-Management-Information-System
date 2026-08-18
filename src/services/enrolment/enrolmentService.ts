import {
  EnrolleeRecord,
  EnrolmentCategory,
  EnrolmentSector,
  EnrolmentColumnMapping,
  EnrolmentField,
  EnrolmentValidationError,
  EnrolmentErrorCode,
} from '../../types/enrolment/enrolmentTypes';
import { ProviderMatch } from '../../types/financial-data';
import { aiIngestionEngine } from '../ingestion/aiIngestionEngine';
import {
  fetchEnrolleeById,
  fetchEnrollees,
  fetchEnrolmentAnalytics,
  fetchEnrolmentAnalyticsWithFinance,
  fetchProviderPopulationSummary,
  insertEnrolleeRecords,
  createEnrolmentImportBatch,
  checkDuplicateEnrolmentBatch,
  backfillJulyPhones,
} from '../../repositories/enrolment/enrolmentRepository';

const normalizeText = (value: unknown) => String(value ?? '').trim();

/**
 * Normalize source phone values without inventing or changing the number's
 * meaning. Formatting separators are removed while the original country or
 * local prefix is preserved.
 */
export function normalizePhoneNumber(value: unknown): string | undefined {
  const text = normalizeText(value);
  if (!text) return undefined;
  const normalized = text.replace(/[\s().-]+/g, '');
  return normalized || undefined;
}

const mappingRules: Array<{ field: EnrolmentField | 'ignored'; keywords: string[]; weight: number }> = [
  { field: 'ignored', keywords: ['s/n', 'sn', 'index', 'id', 'account number', 'bank', 'amount', 'capitation fee'], weight: 1.0 },
  { field: 'policyNumber', keywords: ['policy number', 'policy no', 'policy', 'membership number', 'member id', 'enrollee id'], weight: 1.0 },
  { field: 'category', keywords: ['category', 'beneficiary category', 'member category', 'principal/dependant'], weight: 1.0 },
  { field: 'firstName', keywords: ['first name', 'firstname', 'given name', 'other names'], weight: 0.9 },
  { field: 'lastName', keywords: ['last name', 'lastname', 'surname', 'family name'], weight: 0.9 },
  { field: 'gender', keywords: ['gender', 'sex'], weight: 0.8 },
  { field: 'age', keywords: ['age', 'years', 'yrs', 'dob', 'date of birth', 'dateofbirth'], weight: 1.0 },
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

export function detectHeaderRowIndex(matrix: unknown[][]): number {
  return aiIngestionEngine.detectHeaderRowIndex(matrix);
}

export function deriveSectorFromPolicy(policyNumber: string): EnrolmentSector | undefined {
  const normalized = policyNumber.replace(/\s+/g, '').toUpperCase();
  if (/\/C(?:\/|$)/.test(normalized)) return 'formal';
  if (/\/D(?:\/|$)/.test(normalized)) return 'informal';
  // Fallback: default to formal if policy number is valid but lacks explicit /C/ or /D/
  if (normalized.length > 3) return 'formal';
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
  const headerIndex = detectHeaderRowIndex(matrix);
  return aiIngestionEngine.extractWorkbookContext(matrix, headerIndex);
}

/**
 * Derive a facility context from a descriptive workbook filename when the
 * worksheet does not include a provider/facility metadata row or column.
 */
export function extractFacilityNameFromFilename(fileName: string): string | undefined {
  return aiIngestionEngine.extractFacilityNameFromFilename(fileName);
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

const isSummaryRow = (providerName: string): boolean => aiIngestionEngine.isSummaryRow(providerName);

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
  const providerNameField = mappings.find(mapping => mapping.enrolmentField === 'providerName')?.excelField;
  const providerCodeField = mappings.find(mapping => mapping.enrolmentField === 'providerCode')?.excelField;
  const lgaField = mappings.find(mapping => mapping.enrolmentField === 'lga')?.excelField;
  const stateField = mappings.find(mapping => mapping.enrolmentField === 'state')?.excelField;
  const enrichedRows = aiIngestionEngine.inheritRowContext(rows, {
    providerName: providerNameField,
    providerCode: providerCodeField,
    lga: lgaField,
    state: stateField,
  });

  const normalized = enrichedRows.filter(row => {
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
    const rawPhoneNumber = readMappedValue(row, mappings, 'phoneNumber');
    const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
    
    const sourceProviderName = normalizeText(readMappedValue(row, mappings, 'providerName')) || (fallbackMatch ? fallbackMatch.excelName : '');
    const sourceProviderCode = normalizeText(readMappedValue(row, mappings, 'providerCode'));
    const sourceLga = normalizeText(readMappedValue(row, mappings, 'lga'));
    const sourceState = normalizeText(readMappedValue(row, mappings, 'state'));
    
    const match = matchByName.get(sourceProviderName.toLowerCase()) || fallbackMatch;
    const structuredErrors: EnrolmentValidationError[] = [];

    if (!policyNumber) {
      structuredErrors.push({
        code: 'POLICY_NUMBER_MISSING',
        message: 'Policy number is required.',
        field: 'policyNumber',
        severity: 'error',
        suggestedAction: 'Enter a valid policy number before this record can be committed.',
        originalValue: readMappedValue(row, mappings, 'policyNumber')
      });
    } else if (!sector) {
      structuredErrors.push({
        code: 'POLICY_NUMBER_INVALID',
        message: 'Policy number must contain /C/ for formal or /D/ for informal sector.',
        field: 'policyNumber',
        severity: 'error',
        suggestedAction: 'Correct the policy number format in the source Excel and re-upload.',
        originalValue: readMappedValue(row, mappings, 'policyNumber')
      });
    }

    if (!category) {
      structuredErrors.push({
        code: 'CATEGORY_MISSING',
        message: 'CATEGORY must be PRINCIPAL or DEPENDANT.',
        field: 'category',
        severity: 'error',
        suggestedAction: 'Ensure the category column is correctly mapped and contains valid values.',
        originalValue: readMappedValue(row, mappings, 'category')
      });
    }

    if (!firstName) {
      structuredErrors.push({
        code: 'BENEFICIARY_NAME_MISSING',
        message: 'First name is required.',
        field: 'firstName',
        severity: 'error',
        suggestedAction: 'Enter the beneficiary first name.',
        originalValue: readMappedValue(row, mappings, 'firstName')
      });
    }
    if (!lastName) {
      structuredErrors.push({
        code: 'BENEFICIARY_NAME_MISSING',
        message: 'Last name is required.',
        field: 'lastName',
        severity: 'error',
        suggestedAction: 'Enter the beneficiary last name.',
        originalValue: readMappedValue(row, mappings, 'lastName')
      });
    }
    if (!gender) {
      structuredErrors.push({
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Gender is required.',
        field: 'gender',
        severity: 'error',
        suggestedAction: 'Select a gender (Male/Female).',
        originalValue: readMappedValue(row, mappings, 'gender')
      });
    }
    if (rawAge !== undefined && rawAge !== '' && (isNaN(Number(rawAge)) || Number(rawAge) < 0)) {
      structuredErrors.push({
        code: 'AGE_INVALID',
        message: 'Age must be a valid non-negative number.',
        field: 'age',
        severity: 'error',
        suggestedAction: 'Correct the age in the source Excel and re-upload.',
        originalValue: rawAge
      });
    }

    if (!sourceProviderName) {
      structuredErrors.push({
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Facility/provider name is required.',
        field: 'providerName',
        severity: 'error',
        suggestedAction: 'Ensure the provider name column is correctly mapped.',
        originalValue: readMappedValue(row, mappings, 'providerName')
      });
    }

    if (!periodYear || !periodMonth) {
      structuredErrors.push({
        code: 'PERIOD_MISSING',
        message: 'A valid reporting period is required.',
        field: 'reportingMonth',
        severity: 'error',
        suggestedAction: 'Ensure the reporting month and year are correctly detected or selected.',
      });
    }

    if (!match || match.status !== 'confirmed' || !match.matchedProviderId) {
      structuredErrors.push({
        code: match?.status === 'pending' ? 'PROVIDER_MATCH_REVIEW' : 'PROVIDER_NOT_FOUND',
        message: match?.status === 'pending' ? 'Facility match requires manual review.' : 'Facility could not be matched to the Provider Directory.',
        field: 'providerName',
        severity: 'error',
        suggestedAction: 'Resolve the facility match in the Match step.',
        originalValue: sourceProviderName
      });
    }

    const providerName = match?.matchedProviderName || sourceProviderName;
    const providerCode = match?.matchedProviderCode || sourceProviderCode;
    const providerLga = match?.matchedProviderLga || sourceLga;
    const providerState = match?.matchedProviderState || sourceState;
    const providerSenatorialDistrict = match?.matchedProviderSenatorialDistrict || normalizeText(readMappedValue(row, mappings, 'senatorialDistrict')) || undefined;
    
    // Ownership normalization from match or source
    const rawOwnership = match?.matchedProviderOwnership || (row['ownership'] || row['OWNERSHIP'] || row['Ownership']);
    const ownership = smartNormalizeEnrolmentValue('ownership', rawOwnership);

    const recordStatus = structuredErrors.length > 0
      ? (structuredErrors.some(e => e.code === 'PROVIDER_MATCH_REVIEW' || e.code === 'PROVIDER_NOT_FOUND') ? 'match-review-required' : 'error')
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
      phoneNumber,
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
      validationErrors: structuredErrors.map(e => e.message),
      structuredErrors,
      fingerprint: buildEnrolleeFingerprint(policyNumber, period),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        sourceSheet,
        sourceValues: {
          policyNumber: readMappedValue(row, mappings, 'policyNumber'),
          category: readMappedValue(row, mappings, 'category'),
          firstName: readMappedValue(row, mappings, 'firstName'),
          lastName: readMappedValue(row, mappings, 'lastName'),
          gender: readMappedValue(row, mappings, 'gender'),
          age: readMappedValue(row, mappings, 'age'),
          phoneNumber: rawPhoneNumber,
          providerName: readMappedValue(row, mappings, 'providerName'),
          providerCode: readMappedValue(row, mappings, 'providerCode'),
          lga: readMappedValue(row, mappings, 'lga'),
          state: readMappedValue(row, mappings, 'state'),
        },
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
  const groups = new Map<string, EnrolleeRecord[]>();
  
  // First pass: group by fingerprint
  records.forEach(record => {
    const fingerprint = record.fingerprint || buildEnrolleeFingerprint(record.policyNumber, record.period);
    const group = groups.get(fingerprint) || [];
    group.push(record);
    groups.set(fingerprint, group);
  });

  // Second pass: mark ALL duplicates with context about their peers
  return records.map(record => {
    const fingerprint = record.fingerprint || buildEnrolleeFingerprint(record.policyNumber, record.period);
    const group = groups.get(fingerprint) || [];
    const count = group.length;
    
    if (count > 1) {
      // Find other records with same fingerprint to show in the error message
      const peers = group.filter(r => r.id !== record.id);
      const peerDetails = peers.slice(0, 2).map(p => `${p.firstName} ${p.lastName} (Row ${p.sourceRow})`).join(', ');
      const suffix = peers.length > 2 ? ` and ${peers.length - 2} others` : '';

      const duplicateError: EnrolmentValidationError = {
        code: 'DUPLICATE_RECORD',
        message: `Policy number ${record.policyNumber} is shared by ${count} records: ${record.firstName} ${record.lastName} (this row) vs ${peerDetails}${suffix}. All occurrences are excluded.`,
        field: 'policyNumber',
        severity: 'error',
        suggestedAction: 'Ensure each beneficiary has a unique policy number in the source Excel, then re-upload.'
      };
      
      // Clean existing duplicate errors before adding the fresh one
      const otherErrors = (record.structuredErrors || []).filter(e => e.code !== 'DUPLICATE_RECORD');
      
      return { 
        ...record, 
        fingerprint, 
        recordStatus: 'duplicate',
        structuredErrors: [...otherErrors, duplicateError],
        validationErrors: [...otherErrors.map(e => e.message), duplicateError.message]
      };
    }
    
    // If it's no longer a duplicate (e.g. after a manual edit), restore its status if it was 'duplicate'
    if (record.recordStatus === 'duplicate') {
      const remainingErrors = (record.structuredErrors || []).filter(e => e.code !== 'DUPLICATE_RECORD');
      return {
        ...record,
        recordStatus: remainingErrors.length > 0 ? 'error' : 'valid',
        structuredErrors: remainingErrors,
        validationErrors: remainingErrors.map(e => e.message)
      };
    }

    return { ...record, fingerprint };
  });
}

export const enrolmentService = {
  detectHeaderRowIndex,
  deriveSectorFromPolicy,
  normalizeEnrolmentCategory,
  normalizeGender,
  buildEnrolleeFingerprint,
  extractWorkbookContext,
  extractFacilityNameFromFilename,
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
  backfillJulyPhones,
  smartNormalizeEnrolmentValue,
  aiIngestionEngine,
};
