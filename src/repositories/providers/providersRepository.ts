import {
  accessRestricted,
  providerWorkflowError,
  trustedOperationRequired,
} from '../../lib/security/secureContracts';
import { getApiClient } from '../../api/client';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';
import { useMockData } from '../common';
import { apiMocks } from '../../mocks';
import {
  providerDirectory,
  providerProfiles,
  providerRegistrationDraft,
  addProviderMock,
  updateProviderMock,
  setProviderStatusMock,
} from '../../mocks/providersMocks';
import { ProviderDirectoryItem, ProviderLifecycleStatus, ProviderProfile } from '../../types/providers/providerTypes';
import type { ProvidersRow } from '../../lib/supabase/database.types';
import { ProviderMatch } from '../../types/financial-data';

export type ProviderRegistrationCommand = Omit<ProviderDirectoryItem, 'id' | 'providerCode' | 'status' | 'contractStatus' | 'credentialStatus' | 'inspectionStatus' | 'capitationStatus' | 'inspectionRating' | 'lastInspectionDate'> & {
  address?: string | null;
};

export type ProviderOperationalUpdate = Partial<ProviderDirectoryItem> & {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
};

type ProviderDirectoryRpcRow = {
  id: string;
  provider_code: string;
  provider_name: string;
  category: string;
  subcategory?: string | null;
  ownership: string;
  state: string;
  lga: string;
  status: string;
  contract_status: string;
  credential_status: string;
  inspection_status: string;
  capitation_status: string;
  inspection_rating?: string | null;
  last_inspection_date?: string | null;
};

type ProviderProfileRpcRow = ProviderDirectoryRpcRow & {
  services?: string[] | null;
  departments?: string[] | null;
  staff_strength?: number | null;
  equipment?: string[] | null;
  register_position?: number | null;
};

type ProviderDirectoryRpcResult = ProviderDirectoryRpcRow[] | { items: ProviderDirectoryRpcRow[] };
type ProviderAdminResponse = { data?: { provider?: ProviderDirectoryRpcRow } };
type ProviderAdminFunctionError = { message?: string; context?: { json?: () => Promise<unknown> } } | null;
type ProviderAdminFunctionClient = {
  functions: {
    invoke: <T>(functionName: string, options: { body: Record<string, unknown> }) => Promise<{ data: T | null; error: ProviderAdminFunctionError }>;
  };
};

const providerWorkflowCodes = [
  'UNAUTHORIZED',
  'AAL_REQUIRED',
  'VALIDATION_ERROR',
  'DUPLICATE_PROVIDER',
  'PROVIDER_NOT_FOUND',
  'INVALID_LIFECYCLE_TRANSITION',
  'TRUSTED_OPERATION_REQUIRED',
  'AUDIT_FAILURE',
  'INTERNAL_ERROR',
] as const;

type ProviderWorkflowCode = (typeof providerWorkflowCodes)[number];

function directoryRows(result: ProviderDirectoryRpcResult): ProviderDirectoryRpcRow[] {
  return Array.isArray(result) ? result : result.items;
}

function normalizedLifecycleStatus(status: string): ProviderLifecycleStatus {
  return status.trim().toLowerCase() as ProviderLifecycleStatus;
}

function mapDirectoryRow(row: ProviderDirectoryRpcRow): ProviderDirectoryItem {
  return {
    id: row.id,
    providerCode: row.provider_code,
    providerName: row.provider_name,
    category: row.category as ProviderDirectoryItem['category'],
    subcategory: row.subcategory ?? '',
    ownership: row.ownership as ProviderDirectoryItem['ownership'],
    lga: row.lga,
    state: row.state,
    contactPerson: '',
    phone: '',
    email: '',
    status: normalizedLifecycleStatus(row.status),
    contractStatus: row.contract_status as ProviderDirectoryItem['contractStatus'],
    credentialStatus: row.credential_status as ProviderDirectoryItem['credentialStatus'],
    inspectionStatus: row.inspection_status as ProviderDirectoryItem['inspectionStatus'],
    capitationStatus: row.capitation_status as ProviderDirectoryItem['capitationStatus'],
    inspectionRating: row.inspection_rating ?? '',
    lastInspectionDate: row.last_inspection_date ?? '',
  };
}

function mapOperationalProfile(row: ProviderProfileRpcRow): ProviderProfile {
  return {
    ...mapDirectoryRow(row),
    address: 'Access restricted',
    bankName: 'Access restricted',
    accountName: 'Access restricted',
    accountNumber: 'Access restricted',
    services: row.services ?? [],
    departments: row.departments ?? [],
    staffStrength: row.staff_strength ?? 0,
    equipment: row.equipment ?? [],
    documents: [],
    timeline: [],
    performance: { inspectionRating: 0, complaintScore: 0, utilization: 0, claimsTrend: 'unavailable', capitationTrend: 'unavailable', compliance: 0 },
    communicationHistory: [],
    registerPosition: row.register_position ?? undefined,
  };
}

function isProviderWorkflowCode(value: unknown): value is ProviderWorkflowCode {
  return typeof value === 'string' && (providerWorkflowCodes as readonly string[]).includes(value);
}

async function mapProviderAdminError(error: ProviderAdminFunctionError) {
  let code: ProviderWorkflowCode = 'INTERNAL_ERROR';
  try {
    const body = await error?.context?.json?.();
    if (body && typeof body === 'object' && isProviderWorkflowCode((body as { code?: unknown }).code)) {
      code = (body as { code: ProviderWorkflowCode }).code;
    }
  } catch {
    // The Edge Function error body is intentionally optional and never exposed to the UI.
  }
  if (code === 'TRUSTED_OPERATION_REQUIRED') throw trustedOperationRequired('provider administration');
  throw providerWorkflowError(code);
}

async function invokeProviderAdmin(body: Record<string, unknown>): Promise<ProviderDirectoryItem> {
  const client = getApiClient() as unknown as ProviderAdminFunctionClient;
  const { data, error } = await client.functions.invoke<ProviderAdminResponse>('nmis-provider-admin', { body });
  if (error) await mapProviderAdminError(error);
  const row = data?.data?.provider;
  if (!row) throw providerWorkflowError('INTERNAL_ERROR');
  return mapDirectoryRow(row);
}

/** Legacy raw provider calls remain blocked in live mode. */
export async function getProviders(): Promise<ProvidersRow[]> {
  if (useMockData) return apiMocks.getProviders();
  throw accessRestricted('raw provider records');
}

export async function getProviderById(id: string): Promise<ProvidersRow> {
  if (useMockData) return apiMocks.getProviderById(id);
  throw accessRestricted('raw provider record');
}

export async function createProvider(payload: Partial<ProvidersRow>): Promise<ProvidersRow> {
  if (useMockData) return apiMocks.createProvider(payload);
  throw trustedOperationRequired('provider registration');
}

export async function updateProvider(id: string, payload: Partial<ProvidersRow>): Promise<ProvidersRow> {
  if (useMockData) return apiMocks.updateProvider(id, payload);
  throw trustedOperationRequired('provider edit');
}

export async function deleteProvider(id: string): Promise<boolean> {
  if (useMockData) return apiMocks.deleteProvider(id);
  throw trustedOperationRequired('provider retention or correction');
}

export async function getProviderDirectory(filters: Record<string, any> = {}): Promise<ProviderDirectoryItem[] & { totalCount?: number }> {
  const page = filters.page && filters.page > 0 ? Number(filters.page) : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? Number(filters.pageSize) : 50;
  const offset = (page - 1) * pageSize;

  const rpcFilters = {
    p_search: filters.search || null,
    p_state: null, // State is permanently Ondo
    p_lga: filters.lga === 'all' ? null : filters.lga,
    p_category: filters.category === 'all' ? null : filters.category,
    p_ownership: filters.ownership === 'all' ? null : filters.ownership,
    p_status: filters.status === 'all' ? null : filters.status,
    p_contract_status: filters.contractStatus === 'all' ? null : filters.contractStatus,
    p_credential_status: filters.credentialStatus === 'all' ? null : filters.credentialStatus,
    p_inspection_status: filters.inspectionStatus === 'all' ? null : filters.inspectionStatus,
    p_capitation_status: filters.capitationStatus === 'all' ? null : filters.capitationStatus,
  };

  if (useMockData) {
    const sorted = [...providerDirectory].sort((a, b) => a.providerName.localeCompare(b.providerName));
    const totalCount = sorted.length;
    const paged = sorted.slice(offset, offset + pageSize);
    const items = paged.map((item, index) => ({
      ...item,
      providerCode: String(offset + index + 1).padStart(3, '0'),
    })) as ProviderDirectoryItem[] & { totalCount: number };
    items.totalCount = totalCount;
    return items;
  }

  const [result, countResult, summaryResult] = await Promise.all([
    invokeSecureRpc<ProviderDirectoryRpcResult>('nmis_list_provider_directory', {
      ...rpcFilters,
      p_offset: offset,
      p_page_size: pageSize,
      p_sort: 'provider_name',
    }),
    invokeSecureRpc<number>('nmis_count_provider_directory', rpcFilters),
    invokeSecureRpc<any[]>('nmis_provider_directory_summary', rpcFilters)
  ]);

  const rawList = directoryRows(result).map(mapDirectoryRow);
  const sorted = rawList.sort((a, b) => a.providerName.localeCompare(b.providerName));
  const items = sorted.map((item, index) => ({
    ...item,
    providerCode: String(offset + index + 1).padStart(3, '0'),
  })) as ProviderDirectoryItem[] & { totalCount?: number; activeCount?: number; pendingCount?: number; riskCount?: number };

  const totalCount = typeof countResult === 'number' ? countResult : items.length;
  items.totalCount = totalCount;

  const summary = Array.isArray(summaryResult) && summaryResult.length > 0 ? summaryResult[0] : null;
  if (summary) {
    items.activeCount = Number(summary.active_providers ?? totalCount);
    items.pendingCount = Number(summary.pending_providers ?? 0);
    items.riskCount = Number(summary.risk_providers ?? 0);
  } else {
    items.activeCount = totalCount;
    items.pendingCount = 0;
    items.riskCount = 0;
  }

  return items;
}

export async function createDirectoryProvider(payload: ProviderRegistrationCommand): Promise<ProviderDirectoryItem> {
  if (useMockData) {
    return addProviderMock({
      ...payload,
      providerCode: 'NMIS-MOCK-' + Math.floor(Math.random() * 1000),
      state: payload.state || 'Ondo',
      contactPerson: payload.contactPerson || '',
      phone: payload.phone || '',
      email: payload.email || '',
      status: ProviderLifecycleStatus.Pending,
      contractStatus: 'pending' as ProviderDirectoryItem['contractStatus'],
      credentialStatus: 'pending' as ProviderDirectoryItem['credentialStatus'],
      inspectionStatus: 'pending' as ProviderDirectoryItem['inspectionStatus'],
      capitationStatus: 'not-started' as ProviderDirectoryItem['capitationStatus'],
      inspectionRating: '',
      lastInspectionDate: '',
    });
  }
  return invokeProviderAdmin({
    command: 'register',
    payload: {
      provider_name: payload.providerName,
      category: payload.category,
      subcategory: payload.subcategory || null,
      ownership: payload.ownership,
      state: payload.state || 'Ondo',
      lga: payload.lga,
      address: payload.address || null,
      contact_person: payload.contactPerson || null,
      phone: payload.phone || null,
      email: payload.email || null,
    },
  });
}

export async function updateDirectoryProvider(id: string, payload: ProviderOperationalUpdate): Promise<ProviderDirectoryItem> {
  if (useMockData) return updateProviderMock(id, payload);
  const safePayload: Record<string, unknown> = {};
  
  if (payload.providerName !== undefined) safePayload.provider_name = payload.providerName;
  if (payload.category !== undefined) safePayload.category = payload.category;
  if (payload.subcategory !== undefined) safePayload.subcategory = payload.subcategory || null;
  if (payload.ownership !== undefined) safePayload.ownership = payload.ownership;
  if (payload.state !== undefined) safePayload.state = payload.state;
  if (payload.lga !== undefined) safePayload.lga = payload.lga;
  if ((payload as any).address !== undefined) safePayload.address = (payload as any).address || null;
  if (payload.contactPerson !== undefined) safePayload.contact_person = payload.contactPerson || null;
  if (payload.phone !== undefined) safePayload.phone = payload.phone || null;
  if (payload.email !== undefined) safePayload.email = payload.email || null;
  if (payload.bankName !== undefined) safePayload.bank_name = payload.bankName || null;
  if (payload.accountName !== undefined) safePayload.account_name = payload.accountName || null;
  if (payload.accountNumber !== undefined) safePayload.account_number = payload.accountNumber || null;

  return invokeProviderAdmin({ command: 'edit_operational', providerId: id, payload: safePayload });
}

export async function setProviderLifecycleStatus(id: string, status: ProviderLifecycleStatus): Promise<ProviderDirectoryItem> {
  if (useMockData) return setProviderStatusMock(id, status);
  return invokeProviderAdmin({ command: 'change_lifecycle', providerId: id, payload: { status } });
}

export async function findSafeProviderMatchCandidates(query: string, limit = 10): Promise<ProviderDirectoryItem[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  if (useMockData) {
    const needle = normalizedQuery.toLowerCase();
    return providerDirectory
      .filter(provider => [provider.providerCode, provider.providerName, provider.lga].join(' ').toLowerCase().includes(needle))
      .slice(0, Math.min(Math.max(limit, 1), 25));
  }
  const result = await invokeSecureRpc<ProviderDirectoryRpcResult>('nmis_list_provider_directory', {
    p_search: normalizedQuery,
    p_page_size: Math.min(Math.max(limit, 1), 25),
    p_sort: 'provider_name',
  });
  return directoryRows(result).map(mapDirectoryRow);
}

export async function getProviderProfile(providerId: string): Promise<ProviderProfile> {
  if (useMockData) {
    const profile = providerProfiles.find(provider => provider.id === providerId);
    if (!profile) throw new Error('Provider profile not found');
    return profile;
  }
  const result = await invokeSecureRpc<ProviderProfileRpcRow | ProviderProfileRpcRow[]>('nmis_get_provider_operational_profile', { p_provider_id: providerId });
  const row = Array.isArray(result) ? result[0] : result;
  if (!row) throw accessRestricted('provider operational profile');
  return mapOperationalProfile(row);
}

export async function getProviderRegistrationDraft() {
  return providerRegistrationDraft;
}

export async function getProviderContacts(_providerId: string) {
  throw accessRestricted('provider contact data');
}

export async function getProviderFacilities(_providerId: string) {
  throw accessRestricted('provider facility data');
}

export async function saveProviderMatchResolution(match: ProviderMatch, _resolvedBy?: string) {
  if (useMockData) {
    console.log('[Mock] Saving provider match resolution:', match);
    return;
  }
  throw trustedOperationRequired('provider match resolution');
}

export async function getPersistedProviderMatches(): Promise<Record<string, ProviderMatch>> {
  if (useMockData) return {};
  try {
    // Attempt to fetch from a secure RPC if it exists, otherwise return empty
    const result = await invokeSecureRpc<Record<string, ProviderMatch>>('nmis_get_persisted_matches');
    return result || {};
  } catch (error) {
    // Graceful degradation: if the history contract is unavailable, matching continues without history
    return {};
  }
}
