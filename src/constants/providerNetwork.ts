export enum ProviderCategory {
  Hospital = 'HOSPITAL',
  DiagnosticCentre = 'DIAGNOSTIC_CENTRE',
  Pharmacy = 'PHARMACY',
  OpticalCentre = 'OPTICAL_CENTRE',
  DentalCentre = 'DENTAL_CENTRE',
}

export const PROVIDER_CATEGORY_LABELS: Record<ProviderCategory, string> = {
  [ProviderCategory.Hospital]: 'Hospital',
  [ProviderCategory.DiagnosticCentre]: 'Diagnostic Centre',
  [ProviderCategory.Pharmacy]: 'Pharmacy',
  [ProviderCategory.OpticalCentre]: 'Optical Centre',
  [ProviderCategory.DentalCentre]: 'Dental Centre',
};

export const PROVIDER_CATEGORY_VALUES = Object.values(ProviderCategory);

const LEGACY_PROVIDER_CATEGORY_LABELS: Record<string, string> = {
  Hospital: 'Hospital',
  'Primary Health Centre (PHC)': 'Hospital',
  Clinic: 'Hospital',
  'Diagnostic Centre': 'Diagnostic Centre',
  'Diagnostic & Imaging Centre': 'Diagnostic Centre',
  Laboratory: 'Diagnostic Centre',
  'Specialist Centre': 'Hospital',
  'Referral Centre': 'Hospital',
};

export function getProviderCategoryLabel(category?: string | null): string {
  if (!category) return 'Not supplied';
  return PROVIDER_CATEGORY_LABELS[category as ProviderCategory] || LEGACY_PROVIDER_CATEGORY_LABELS[category] || category;
}

export enum ProviderOwnership {
  Government = 'Government',
  Private = 'Private',
}

export enum ProviderLifecycleStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Suspended = 'suspended',
  Blacklisted = 'blacklisted',
  Expired = 'expired',
}

export enum ProviderWorkflowStatus {
  Complete = 'complete',
  Pending = 'pending',
  InReview = 'in-review',
  Expired = 'expired',
  NotStarted = 'not-started',
  Flagged = 'flagged',
}

export enum InspectionRatingGroup {
  Excellent = 'Excellent',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
}

// Categories are intentionally flat. Subcategory remains nullable in the database for backward compatibility,
// but the provider workflow does not expose a hierarchy or require a subcategory.
export const PROVIDER_CATEGORY_TREE = PROVIDER_CATEGORY_VALUES.map(category => ({
  category,
  subcategories: [] as const,
})) as readonly { category: ProviderCategory; subcategories: readonly [] }[];

export const PROVIDER_CATEGORIES = PROVIDER_CATEGORY_VALUES;
export const PROVIDER_SUBCATEGORIES: readonly string[] = [];
export const PROVIDER_OWNERSHIPS = Object.values(ProviderOwnership);
export const PROVIDER_STATUSES = Object.values(ProviderLifecycleStatus);
export const PROVIDER_WORKFLOW_STATUSES = Object.values(ProviderWorkflowStatus);

export const PROVIDER_IMPORT_EXPORT_COLUMNS = [
  'Provider Code',
  'Provider Name',
  'Provider Category',
  'Ownership',
  'LGA',
  'Contact Person',
  'Phone',
  'Email',
  'Status',
  'Contract Status',
  'Credential Status',
  'Inspection Status',
  'Capitation Status',
  'Inspection Rating',
  'Last Inspection Date',
] as const;

export const PROVIDER_REPORT_GROUPINGS = [
  'Category',
  'Ownership',
  'LGA',
  'Contract Status',
  'Inspection Rating',
] as const;
