import {
  accessRestricted,
  providerWorkflowError,
  trustedOperationRequired,
} from '../../lib/security/secureContracts';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';
import { useMockData } from '../common';
import * as apiMocks from '../../mocks/apiMocks';
import {
  providerDirectory,
  providerProfiles,
  providerRegistrationDraft,
  addProviderMock,
  updateProviderMock,
  setProviderStatusMock,
} from '../../mocks/providersMocks';
import { ProviderDirectoryFilters, ProviderDirectoryItem, ProviderLifecycleStatus, ProviderProfile } from '../../types/providers/providerTypes';
import type { ProviderMatch } from '../../types/financial-data';
import type { ProvidersRow } from '../../lib/supabase/database.types';
import { loadOfflineInspectionPack } from '../../lib/offline/inspectionOfflineStore';

export type ProviderRegistrationCommand = Omit<ProviderDirectoryItem, 'id' | 'providerCode' | 'status' | 'contractStatus' | 'credentialStatus' | 'inspectionStatus' | 'capitationStatus' | 'inspectionRating' | 'lastInspectionDate'> & {
  address?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
};

export type ProviderOperationalUpdate = Partial<ProviderDirectoryItem> & {
  address?: string | null;
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
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  contract_status: string;
  credential_status: string;
  inspection_status: string;
  capitation_status: string;
  inspection_rating?: string | null;
  last_inspection_date?: string | null;
  services?: string[] | null;
  senatorial_district?: string | null;
  register_position?: number | null;
};

type ProviderProfileRpcRow = ProviderDirectoryRpcRow & {
  address?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  services?: string[] | null;
  departments?: string[] | null;
  staff_strength?: number | null;
  equipment?: string[] | null;
  register_position?: number | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
};

type ProviderDirectoryRpcResult = ProviderDirectoryRpcRow[] | { items: ProviderDirectoryRpcRow[] };

function directoryRows(result: ProviderDirectoryRpcResult): ProviderDirectoryRpcRow[] {
  return Array.isArray(result) ? result : result.items;
}

function canonicalLgaFilter(value: unknown): string | null {
  if (typeof value !== 'string' || value === 'all') return null;
  return value
    .replace(/[‐‑‒–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedLifecycleStatus(status: string): ProviderLifecycleStatus {
  return status.trim().toLowerCase() as ProviderLifecycleStatus;
}

function mapDirectoryRow(row: ProviderDirectoryRpcRow): ProviderDirectoryItem {
  return {
    id: row.id,
    providerCode: row.register_position
      ? String(row.register_position).padStart(3, '0')
      : row.provider_code,
    providerName: row.provider_name,
    category: row.category as ProviderDirectoryItem['category'],
    subcategory: row.subcategory ?? '',
    ownership: row.ownership as ProviderDirectoryItem['ownership'],
    lga: row.lga,
    state: row.state,
    contactPerson: row.contact_person ?? 'Pending verification',
    phone: row.phone ?? 'Pending verification',
    email: row.email ?? 'Pending verification',
    status: normalizedLifecycleStatus(row.status),
    contractStatus: row.contract_status as ProviderDirectoryItem['contractStatus'],
    credentialStatus: row.credential_status as ProviderDirectoryItem['credentialStatus'],
    inspectionStatus: row.inspection_status as ProviderDirectoryItem['inspectionStatus'],
    capitationStatus: row.capitation_status as ProviderDirectoryItem['capitationStatus'],
    inspectionRating: row.inspection_rating ?? '',
    lastInspectionDate: row.last_inspection_date ?? '',
    services: row.services ?? [],
    senatorialDistrict: row.senatorial_district ?? '',
  };
}

function mapOperationalProfile(row: ProviderProfileRpcRow): ProviderProfile {
  return {
    ...mapDirectoryRow(row),
    address: row.address ?? 'Pending verification',
    contactPerson: row.contact_person ?? 'Pending verification',
    phone: row.phone ?? 'Pending verification',
    email: row.email ?? 'Pending verification',
    bankName: row.bank_name ?? 'Pending verification',
    accountName: row.account_name ?? 'Pending verification',
    accountNumber: row.account_number ?? 'Pending verification',
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

type ProviderAdminWriteResult = { provider?: ProviderDirectoryRpcRow };

async function invokeProviderAdmin(args: { command: string; providerId?: string | null; payload: Record<string, unknown> }): Promise<ProviderDirectoryItem> {
  const result = await invokeSecureRpc<ProviderAdminWriteResult>('nmis_provider_admin_write', {
    p_command: args.command,
    p_provider_id: args.providerId || null,
    p_payload: args.payload,
  });

  if (args.command === 'delete_provider') {
    return {} as ProviderDirectoryItem;
  }

  const row = result?.provider;
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

type ProviderDirectoryResult = ProviderDirectoryItem[] & { totalCount?: number; activeCount?: number; pendingCount?: number; riskCount?: number };

export async function getProviderDirectory(filters: Partial<ProviderDirectoryFilters> = {}): Promise<ProviderDirectoryResult> {
  const page = filters.page && filters.page > 0 ? Number(filters.page) : 1;
  const isAll = filters.pageSize === -1;
  // The secured provider RPC caps one request at 1,000 rows. In all-records mode,
  // fetch successive pages below instead of sending an invalid oversized request.
  const pageSize = isAll ? 1000 : (filters.pageSize && filters.pageSize > 0 ? Math.min(Number(filters.pageSize), 1000) : 50);
  const offset = isAll ? 0 : (page - 1) * pageSize;

  const rpcFilters = {
    p_search: filters.search || null,
    p_state: null,
    p_lga: canonicalLgaFilter(filters.lga),
    p_category: filters.category === 'all' ? null : filters.category,
    p_ownership: filters.ownership === 'all' ? null : filters.ownership,
    p_status: filters.status === 'all' ? null : filters.status,
    p_contract_status: filters.contractStatus === 'all' ? null : filters.contractStatus,
    p_credential_status: filters.credentialStatus === 'all' ? null : filters.credentialStatus,
    p_inspection_status: filters.inspectionStatus === 'all' ? null : filters.inspectionStatus,
    p_capitation_status: filters.capitationStatus === 'all' ? null : filters.capitationStatus,
  };
  const listRpcFilters = {
    ...rpcFilters,
    p_service: filters.service === 'all' ? null : filters.service,
  };

  if (useMockData) {
    const sorted = [...providerDirectory].sort((a, b) => a.providerName.localeCompare(b.providerName));
    const totalCount = sorted.length;
    const paged = isAll ? sorted : sorted.slice(offset, offset + pageSize);
    const items = paged.map((item, index) => ({
      ...item,
      providerCode: String(offset + index + 1).padStart(3, '0'),
    })) as ProviderDirectoryItem[] & { totalCount: number; activeCount: number; pendingCount: number; riskCount: number };
    
    items.totalCount = totalCount;
    items.activeCount = sorted.filter(p => p.status === 'active').length;
    items.pendingCount = sorted.filter(p => p.status === 'pending').length;
    items.riskCount = sorted.filter(p => ['suspended', 'blacklisted', 'expired'].includes(p.status)).length;
    
    return items;
  }

  let result: ProviderDirectoryRpcResult;
  let countResult: number;
  let summaryResult: Array<Record<string, unknown>>;
  try {
    [result, countResult, summaryResult] = await Promise.all([
      invokeSecureRpc<ProviderDirectoryRpcResult>('nmis_list_provider_directory', {
        ...listRpcFilters,
        p_offset: offset,
        p_page_size: pageSize,
        p_sort: 'provider_name',
      }),
      invokeSecureRpc<number>('nmis_count_provider_directory', rpcFilters),
      invokeSecureRpc<Array<Record<string, unknown>>>('nmis_provider_directory_summary', rpcFilters)
    ]);
  } catch (error) {
    const cached = await loadOfflineInspectionPack().catch(() => null);
    if (!cached) throw error;
    const search = String(filters.search || '').trim().toLowerCase();
    const filtered = cached.providers.filter(provider => {
      if (search && ![provider.providerName, provider.providerCode, provider.lga].some(value => String(value || '').toLowerCase().includes(search))) return false;
      if (filters.category !== 'all' && filters.category && provider.category !== filters.category) return false;
      if (filters.ownership !== 'all' && filters.ownership && provider.ownership !== filters.ownership) return false;
      if (filters.status !== 'all' && filters.status && provider.status !== filters.status) return false;
      return true;
    });
    const pageItems = isAll ? filtered : filtered.slice(offset, offset + pageSize);
    const offlineItems = pageItems as ProviderDirectoryItem[] & { totalCount?: number };
    offlineItems.totalCount = filtered.length;
    return offlineItems;
  }

  let rawRows = directoryRows(result);
  const totalCount = typeof countResult === 'number' ? countResult : rawRows.length;
  if (isAll && totalCount > pageSize) {
    const additionalPages = await Promise.all(
      Array.from({ length: Math.ceil(totalCount / pageSize) - 1 }, (_, index) => invokeSecureRpc<ProviderDirectoryRpcResult>('nmis_list_provider_directory', {
        ...listRpcFilters,
        p_offset: (index + 1) * pageSize,
        p_page_size: pageSize,
        p_sort: 'provider_name',
      })),
    );
    rawRows = [...rawRows, ...additionalPages.flatMap(directoryRows)];
  }

  const rawList = rawRows.map(mapDirectoryRow);
  const sorted = rawList.sort((a, b) => a.providerName.localeCompare(b.providerName));
  const items = sorted.map((item, index) => ({
    ...item,
    providerCode: String(offset + index + 1).padStart(3, '0'),
  })) as ProviderDirectoryResult;

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
      state: 'Ondo',
      lga: payload.lga,
      address: payload.address || null,
      contact_person: payload.contactPerson || null,
      phone: payload.phone || null,
      email: payload.email || null,
      services: payload.services || [],
      bank_name: payload.bankName || null,
      account_name: payload.accountName || null,
      account_number: payload.accountNumber || null,
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
  if (payload.lga !== undefined) safePayload.lga = payload.lga;
  if (payload.address !== undefined) safePayload.address = payload.address || null;
  if (payload.contactPerson !== undefined) safePayload.contact_person = payload.contactPerson || null;
  if (payload.phone !== undefined) safePayload.phone = payload.phone || null;
  if (payload.email !== undefined) safePayload.email = payload.email || null;
  if (payload.services !== undefined) safePayload.services = payload.services || [];
  if (payload.bankName !== undefined) safePayload.bank_name = payload.bankName || null;
  if (payload.accountName !== undefined) safePayload.account_name = payload.accountName || null;
  if (payload.accountNumber !== undefined) safePayload.account_number = payload.accountNumber || null;

  return invokeProviderAdmin({ command: 'edit_operational', providerId: id, payload: safePayload });
}

export async function setProviderLifecycleStatus(id: string, status: ProviderLifecycleStatus): Promise<ProviderDirectoryItem> {
  if (useMockData) return setProviderStatusMock(id, status);
  return invokeProviderAdmin({ command: 'change_lifecycle', providerId: id, payload: { status } });
}

export async function deleteDirectoryProvider(id: string): Promise<boolean> {
  if (useMockData) return true;
  await invokeProviderAdmin({ command: 'delete_provider', providerId: id, payload: {} });
  return true;
}

export async function findSafeProviderMatchCandidates(query: string, limit = 10): Promise<ProviderDirectoryItem[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const resultLimit = Math.min(Math.max(limit, 1), 25);

  if (useMockData) {
    const needle = normalizedQuery.toLowerCase();
    return providerDirectory
      .filter(provider => [provider.providerCode, provider.providerName, provider.lga].join(' ').toLowerCase().includes(needle))
      .slice(0, resultLimit);
  }

  // Manual resolution must use the same secure import-matching contract as
  // automatic matching. The provider-directory RPC is a separate contract and
  // may be unavailable in environments where import matching is enabled.
  const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '00000000-0000-4000-8000-000000000001';
  const result = await invokeSecureRpc<{
    candidates?: Array<{
      id: string;
      provider_code: string;
      provider_name: string;
      category: string;
      ownership: string;
      state: string;
      lga: string;
      status: string;
    }>;
  }>('nmis_import_match_candidates', {
    p_import_session_id: sessionId,
    p_provider_name: normalizedQuery,
    p_provider_code: null,
    p_lga: null,
    p_state: null,
  });

  return (result.candidates ?? []).slice(0, resultLimit).map(candidate => mapDirectoryRow({
    id: candidate.id,
    provider_code: candidate.provider_code,
    provider_name: candidate.provider_name,
    category: candidate.category,
    subcategory: null,
    ownership: candidate.ownership,
    state: candidate.state,
    lga: candidate.lga,
    status: candidate.status,
    contract_status: '',
    credential_status: '',
    inspection_status: '',
    capitation_status: '',
    inspection_rating: null,
    last_inspection_date: null,
  }));
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

export async function getPersistedProviderMatches(): Promise<Record<string, ProviderMatch>> {
  if (useMockData) return {};
  const result = await invokeSecureRpc<ProviderMatch[]>('nmis_get_persisted_provider_matches', {});
  const matches: Record<string, ProviderMatch> = {};
  if (Array.isArray(result)) {
    result.forEach(m => {
      if (m.excel_name) {
        matches[m.excel_name.toLowerCase().trim()] = m;
      }
    });
  }
  return matches;
}

export async function saveProviderMatchResolution(payload: ProviderMatch, _resolvedBy?: string) {
  if (useMockData) return true;
  return invokeSecureRpc<unknown>('nmis_save_provider_match_resolution', payload);
}
