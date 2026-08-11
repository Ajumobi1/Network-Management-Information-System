export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface UsersRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Roles;
  metadata: Json;
  created_at: string;
  updated_at: string | null;
}

export interface RolesRow {
  id: string;
  name: string;
  description: string;
}

export interface PermissionsRow {
  id: string;
  role_id: string;
  permission: Permissions;
  created_at: string;
}

export interface ProvidersRow {
  id: string;
  provider_code: string;
  provider_name: string;
  category: string;
  subcategory: string | null;
  ownership: string;
  lga: string;
  state: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  contract_status: string;
  credential_status: string;
  inspection_status: string;
  capitation_status: string;
  inspection_rating: string | null;
  last_inspection_date: string | null;
  address: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderContactsRow {
  id: string;
  provider_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string | null;
}

export interface FacilitiesRow {
  id: string;
  provider_id: string;
  name: string;
  type: ProviderType;
  address: string;
  region: string;
  active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ProviderCategoriesRow {
  id: string;
  name: string;
  description: string | null;
}

export interface CredentialingRow {
  id: string;
  provider_id: string;
  status: CredentialingStatus;
  requested_at: string;
  completed_at: string | null;
  reviewer_id: string | null;
  notes: string | null;
}

export interface ContractsRow {
  id: string;
  provider_id: string;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  value: number;
  currency: Currency;
  created_at: string;
  updated_at: string | null;
}

export interface CapitationRow {
  id: string;
  provider_id: string;
  period_start: string;
  period_end: string;
  amount: number;
  currency: Currency;
  status: CapitationStatus;
  uploaded_at: string;
  approved_at: string | null;
}

export interface CapitationUploadRow {
  id: string;
  capitation_id: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ImportBatchesRow {
  id: string;
  file_name: string;
  data_type: string;
  reporting_year: number | null;
  reporting_month: number | null;
  uploaded_by: string;
  uploaded_at: string;
  total_rows: number;
  imported_rows: number;
  warning_rows: number;
  error_rows: number;
  duplicate_rows: number;
  unmatched_providers: number;
  total_amount: number | null;
  status: string;
  period_covered: string | null;
  metadata: Json;
}

export interface FinancialRecordsRow {
  id: string;
  provider_id: string | null;
  provider_code: string | null;
  provider_name: string;
  facility_type: string | null;
  ownership: string | null;
  state: string | null;
  lga: string | null;
  reporting_year: number;
  reporting_month: number;
  period: string;
  data_type: string;
  amount_submitted: number | null;
  amount_claimed: number | null;
  amount_approved: number | null;
  amount_paid: number | null;
  net_amount_paid: number | null;
  claim_count: number | null;
  encounter_count: number | null;
  eligible_lives: number | null;
  source_file: string | null;
  import_batch_id: string | null;
  record_status: string;
  fingerprint: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderMatchResolutionsRow {
  id: string;
  excel_name: string;
  matched_provider_id: string | null;
  matched_provider_name: string | null;
  matched_provider_code: string | null;
  match_type: string;
  resolved_by: string | null;
  resolved_at: string;
}

export interface InspectionsRow {
  id: string;
  provider_id: string;
  inspector_id: string;
  scheduled_at: string;
  completed_at: string | null;
  status: InspectionStatus;
  rating: InspectionRating | null;
  notes: string | null;
}

export interface InspectionChecklistRow {
  id: string;
  inspection_id: string;
  item: string;
  completed: boolean;
  comments: string | null;
}

export interface ComplaintsRow {
  id: string;
  provider_id: string;
  reported_at: string;
  status: ComplaintStatus;
  summary: string;
  resolved_at: string | null;
}

export interface ReportsRow {
  id: string;
  title: string;
  type: ReportType;
  created_at: string;
  created_by: string;
  status: ReportStatus;
  metadata: Json;
}

export interface NotificationsRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  level: NotificationLevel;
  created_at: string;
}

export interface AuditLogsRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
}

export interface DocumentsRow {
  id: string;
  owner_id: string;
  provider_id: string | null;
  inspection_id: string | null;
  report_id: string | null;
  file_url: string;
  file_name: string;
  content_type: string;
  uploaded_at: string;
}

export interface SettingsRow {
  id: string;
  key: string;
  value: Json;
  updated_at: string;
}

export type Roles = 'super-admin' | 'admin' | 'reviewer' | 'inspector' | 'finance' | 'provider';
export type Permissions =
  | 'read:dashboard'
  | 'manage:providers'
  | 'manage:credentialing'
  | 'manage:contracts'
  | 'manage:capitation'
  | 'manage:inspections'
  | 'manage:reports'
  | 'manage:notifications'
  | 'manage:settings';
export type ProviderType = 'hospital' | 'pharmacy' | 'laboratory' | 'clinic' | 'specialist' | 'phc';
export type ProviderStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type CredentialingStatus = 'pending' | 'in-review' | 'approved' | 'rejected';
export type ContractStatus = 'draft' | 'active' | 'expiring' | 'expired' | 'terminated';
export type CapitationStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
export type InspectionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type InspectionRating = 'excellent' | 'good' | 'fair' | 'poor';
export type ComplaintStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type ReportType = 'operational' | 'financial' | 'compliance' | 'audit';
export type ReportStatus = 'draft' | 'published' | 'archived';
export type NotificationLevel = 'info' | 'warning' | 'critical' | 'success';
export type Currency = 'NGN' | 'USD' | 'EUR';

export interface Database {
  public: {
    Tables: {
      providers: {
        Row: ProvidersRow;
        Insert: Partial<ProvidersRow>;
        Update: Partial<ProvidersRow>;
      };
      provider_documents: {
        Row: DocumentsRow;
        Insert: Partial<DocumentsRow>;
        Update: Partial<DocumentsRow>;
      };
      import_batches: {
        Row: ImportBatchesRow;
        Insert: Partial<ImportBatchesRow>;
        Update: Partial<ImportBatchesRow>;
      };
      financial_records: {
        Row: FinancialRecordsRow;
        Insert: Partial<FinancialRecordsRow>;
        Update: Partial<FinancialRecordsRow>;
      };
      provider_match_resolutions: {
        Row: ProviderMatchResolutionsRow;
        Insert: Partial<ProviderMatchResolutionsRow>;
        Update: Partial<ProviderMatchResolutionsRow>;
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: Partial<AuditLogsRow>;
        Update: Partial<AuditLogsRow>;
      };
    };
  };
}
