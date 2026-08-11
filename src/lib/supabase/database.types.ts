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
  name: string;
  type: ProviderType;
  category_id: string;
  status: ProviderStatus;
  phone: string | null;
  email: string | null;
  address: string | null;
  region: string | null;
  created_at: string;
  updated_at: string | null;
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
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
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
