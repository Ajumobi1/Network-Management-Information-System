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

const mappingRules: Array<{ field: EnrolmentField; keywords: string[] }> = [
  { field: 'policyNumber', keywords: ['policy number', 'policy no', 'policy', 'membership number', 'member id'] },
  { field: 'category', keywords: ['category', 'beneficiary category', 'member category'] },
  { field: 'firstName', keywords: ['first name', 'firstname', 'given name'] },
  { field: 'lastName', keywords: ['last name', 'lastname', 'surname', 'family name'] },
  { field: 'gender', keywords: ['gender', 'sex'] },
  { field: 'phoneNumber', keywords: ['phone', 'telephone', 'mobile', 'phone number'] },
  { field: 'providerCode', keywords: ['provider code', 'facility code', 'facility id', 'provider id'] },
  { field: 'providerName', keywords: ['provider', 'facility', 'hospital', 'health facility', 'facility name'] },
  { field: 'lga', keywords: ['lga', 'local government', 'local govt'] },
  { field: 'state', keywords: ['state', 'region'] },
  { field: 'senatorialDistrict', keywords: ['senatorial', 'senate district', 'district'] },
  { field: 'reportingMonth', keywords: ['month', 'reporting month'] },
  { field: 'reportingYear', keywords: ['year', 'reporting year'] },
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

export function suggestEnrolmentMappings(headers: string[]): EnrolmentColumnMapping[] {
  return headers.map(excelField => {
    const normalized = normalizeHeader(excelField);
    const match = mappingRules.find(rule => rule.keywords.some(keyword => normalized === keyword || normalized.includes(keyword)));
    const confidenceScore = match ? (match.keywords.some(keyword => normalized === keyword) ? 0.95 : 0.78) : 0;
    return {
      excelField,
      enrolmentField: match?.field || 'ignored',
      confidence: confidenceScore > 0.9 ? 'HIGH' : confidenceScore > 0.6 ? 'MEDIUM' : 'LOW',
      confidenceScore,
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

  const normalized = rows.map((row, index) => {
    const policyNumber = normalizeText(readMappedValue(row, mappings, 'policyNumber'));
    const category = normalizeEnrolmentCategory(readMappedValue(row, mappings, 'category'));
    const sector = deriveSectorFromPolicy(policyNumber);
    const firstName = normalizeText(readMappedValue(row, mappings, 'firstName'));
    const lastName = normalizeText(readMappedValue(row, mappings, 'lastName'));
    const gender = normalizeGender(readMappedValue(row, mappings, 'gender'));
    const sourceProviderName = normalizeText(readMappedValue(row, mappings, 'providerName'));
    const sourceProviderCode = normalizeText(readMappedValue(row, mappings, 'providerCode'));
    const sourceLga = normalizeText(readMappedValue(row, mappings, 'lga'));
    const sourceState = normalizeText(readMappedValue(row, mappings, 'state'));
    const match = matchByName.get(sourceProviderName.toLowerCase());
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
      phoneNumber: normalizeText(readMappedValue(row, mappings, 'phoneNumber')) || undefined,
      providerId: match?.matchedProviderId,
      providerCode: providerCode || undefined,
      providerName,
      facilityType: match?.matchedProviderFacilityType,
      ownership: match?.matchedProviderOwnership,
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
};
