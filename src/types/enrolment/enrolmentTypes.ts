import { ProviderCategory, ProviderOwnership } from '../providers/providerTypes';

export type EnrolmentSector = 'formal' | 'informal';
export type EnrolmentCategory = 'principal' | 'dependant';
export type EnrolmentStatus = 'active' | 'suspended' | 'expired';
export type EnrolmentField =
  | 'policyNumber'
  | 'category'
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'age'
  | 'phoneNumber'
  | 'providerCode'
  | 'providerName'
  | 'lga'
  | 'state'
  | 'senatorialDistrict'
  | 'reportingMonth'
  | 'reportingYear';

export interface EnrolmentColumnMapping {
  excelField: string;
  enrolmentField: EnrolmentField | 'ignored';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  isCustom?: boolean;
}

export interface EnrolleeRecord {
  id: string;
  policyNumber: string;
  category: EnrolmentCategory;
  sector: EnrolmentSector;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  age?: number;
  phoneNumber?: string;

  // Provider association
  providerId?: string;
  providerCode?: string;
  providerName: string;
  facilityType?: ProviderCategory;
  ownership?: ProviderOwnership;

  // Location context
  lga: string;
  state: string;
  senatorialDistrict?: string;

  // Temporal context
  reportingYear: number;
  reportingMonth: number;
  period: string; // YYYY-MM

  // Source context
  sourceFile: string;
  importBatchId: string;
  sourceRow?: number;

  // Status & Protection
  recordStatus: 'valid' | 'warning' | 'error' | 'match-review-required' | 'duplicate';
  validationErrors?: string[];
  fingerprint: string;

  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface EnrolmentFilters {
  search?: string;
  sector?: EnrolmentSector | 'all';
  category?: EnrolmentCategory | 'all';
  gender?: string | 'all';
  state?: string | 'all';
  lga?: string | 'all';
  senatorialDistrict?: string | 'all';
  providerId?: string | 'all';
  period?: string | 'all';
  year?: number;
  month?: number;
}

export interface EnrolmentAnalytics {
  totalEnrollees: number;
  formalCount: number;
  informalCount: number;
  principalCount: number;
  dependantCount: number;
  maleCount: number;
  femaleCount: number;
  providerCount: number;
  lgaCount: number;
  senatorialDistrictCount: number;

  // Percentages
  formalPercentage: number;
  informalPercentage: number;
  principalPercentage: number;
  dependantPercentage: number;

  // Distributions
  bySector: Array<{ name: string; value: number }>;
  byCategory: Array<{ name: string; value: number }>;
  byGender: Array<{ name: string; value: number }>;
  byState: Array<{ name: string; value: number }>;
  byLga: Array<{ name: string; value: number }>;
  bySenatorialDistrict: Array<{ name: string; value: number }>;
  byFacility: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ name: string; value: number }>;
  financialExpenditure: number;
  financialRecordCount: number;
  pepm: number;
  pepmTrend: Array<{ name: string; value: number }>;
}
