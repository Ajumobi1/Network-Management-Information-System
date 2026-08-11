export enum ProviderCategory {
  Hospital = 'Hospital',
  PrimaryHealthCentre = 'Primary Health Centre (PHC)',
  Pharmacy = 'Pharmacy',
  Laboratory = 'Laboratory',
  SpecialistCentre = 'Specialist Centre',
  DiagnosticImagingCentre = 'Diagnostic & Imaging Centre',
  ReferralCentre = 'Referral Centre',
}

export enum ProviderOwnership {
  Private = 'Private',
  Public = 'Public/Government',
  FaithBased = 'Faith-Based',
  Ngo = 'NGO/Non-Profit',
  Corporate = 'Corporate',
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

export const PROVIDER_CATEGORY_TREE = [
  {
    category: ProviderCategory.Hospital,
    subcategories: ['Teaching Hospital', 'Federal Medical Centre', 'General Hospital', 'Specialist Hospital', 'Private Hospital', 'Mission Hospital', 'Cottage Hospital'],
  },
  {
    category: ProviderCategory.PrimaryHealthCentre,
    subcategories: ['Comprehensive PHC', 'Basic PHC', 'Health Clinic', 'Health Post'],
  },
  {
    category: ProviderCategory.Pharmacy,
    subcategories: ['Community Pharmacy', 'Retail Pharmacy', 'Hospital Pharmacy'],
  },
  {
    category: ProviderCategory.Laboratory,
    subcategories: ['Medical Laboratory', 'Diagnostic Laboratory', 'Pathology Laboratory'],
  },
  {
    category: ProviderCategory.SpecialistCentre,
    subcategories: ['Eye Clinic', 'Dental Clinic', 'Physiotherapy Centre', 'Dialysis Centre', 'Oncology Centre', 'Cardiology Centre', 'Orthopaedic Centre', 'Fertility Centre', 'Mental Health Centre'],
  },
  {
    category: ProviderCategory.DiagnosticImagingCentre,
    subcategories: ['X-Ray Centre', 'CT Scan Centre', 'MRI Centre', 'Ultrasound Centre'],
  },
  {
    category: ProviderCategory.ReferralCentre,
    subcategories: ['Secondary Referral Centre', 'Tertiary Referral Centre', 'National Referral Centre'],
  },
] as const;

export const PROVIDER_CATEGORIES = PROVIDER_CATEGORY_TREE.map(item => item.category);
export const PROVIDER_SUBCATEGORIES = PROVIDER_CATEGORY_TREE.flatMap(item => item.subcategories);
export const PROVIDER_OWNERSHIPS = Object.values(ProviderOwnership);
export const PROVIDER_STATUSES = Object.values(ProviderLifecycleStatus);
export const PROVIDER_WORKFLOW_STATUSES = Object.values(ProviderWorkflowStatus);

export const PROVIDER_IMPORT_EXPORT_COLUMNS = [
  'Provider Code',
  'Provider Name',
  'Provider Category',
  'Provider Subcategory',
  'Ownership',
  'State',
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
  'Subcategory',
  'Ownership',
  'State',
  'LGA',
  'Contract Status',
  'Inspection Rating',
] as const;
