import { fetchTable, fetchSingle, insertRow, updateRow, deleteRow, useMockData, upsertRow } from '../common';
import { getApiClient } from '../../api/client';
import { formatSupabaseError } from '../../utils/api';
import { apiMocks } from '../../mocks';
import { ProvidersRow, ProviderMatchResolutionsRow } from '../../lib/supabase/database.types';
import { 
  providerDirectory, 
  providerProfiles, 
  providerRegistrationDraft,
  addProviderMock,
  updateProviderMock,
  setProviderStatusMock
} from '../../mocks/providersMocks';
import { ProviderDirectoryItem, ProviderLifecycleStatus, ProviderProfile } from '../../types/providers/providerTypes';
import { ProviderMatch } from '../../types/financial-data';
import { logAction } from '../audit/auditRepository';

/**
 * Basic CRUD operations for Providers
 */

export async function getProviders() {
  if (useMockData) {
    return apiMocks.getProviders();
  }
  return fetchTable<ProvidersRow>('providers');
}

export async function getProviderById(id: string) {
  if (useMockData) {
    return apiMocks.getProviderById(id);
  }
  return fetchSingle<ProvidersRow>('providers', 'id', id);
}

export async function createProvider(payload: Partial<ProvidersRow>) {
  if (useMockData) {
    return apiMocks.createProvider(payload);
  }
  const created = await insertRow<ProvidersRow>('providers', payload);
  await logAction({
    action: 'PROVIDER_CREATED',
    entity: 'providers',
    entityId: created.id,
    metadata: { providerName: created.provider_name, providerCode: created.provider_code }
  });
  return created;
}

export async function updateProvider(id: string, payload: Partial<ProvidersRow>) {
  if (useMockData) {
    return apiMocks.updateProvider(id, payload);
  }
  const updated = await updateRow<ProvidersRow>('providers', id, payload);
  await logAction({
    action: 'PROVIDER_UPDATED',
    entity: 'providers',
    entityId: id,
    metadata: { changes: payload }
  });
  return updated;
}

export async function deleteProvider(id: string) {
  if (useMockData) {
    return apiMocks.deleteProvider(id);
  }
  await logAction({
    action: 'PROVIDER_DELETED',
    entity: 'providers',
    entityId: id
  });
  return deleteRow('providers', id);
}

/**
 * Extended Provider Directory & Profile operations
 */

export async function getProviderDirectory(): Promise<ProviderDirectoryItem[]> {
  if (useMockData) {
    return providerDirectory;
  }
  
  const providers = await fetchTable<ProvidersRow>('providers');
  // Map Supabase row to UI type
  return providers.map(p => ({
    id: p.id,
    providerCode: p.provider_code,
    providerName: p.provider_name,
    category: p.category as any,
    subcategory: p.subcategory || '',
    ownership: p.ownership as any,
    lga: p.lga,
    state: p.state,
    contactPerson: p.contact_person || '',
    phone: p.phone || '',
    email: p.email || '',
    status: p.status as ProviderLifecycleStatus,
    contractStatus: p.contract_status as any,
    credentialStatus: p.credential_status as any,
    inspectionStatus: p.inspection_status as any,
    capitationStatus: p.capitation_status as any,
    inspectionRating: p.inspection_rating || '',
    lastInspectionDate: p.last_inspection_date || '',
  }));
}

export async function createDirectoryProvider(payload: Omit<ProviderDirectoryItem, 'id'>) {
  if (useMockData) {
    return addProviderMock(payload);
  }
  
  // Map UI type to Supabase row
  const row: Partial<ProvidersRow> = {
    provider_code: payload.providerCode,
    provider_name: payload.providerName,
    category: payload.category,
    subcategory: payload.subcategory,
    ownership: payload.ownership,
    lga: payload.lga,
    state: payload.state,
    contact_person: payload.contactPerson,
    phone: payload.phone,
    email: payload.email,
    status: payload.status,
    contract_status: payload.contractStatus,
    credential_status: payload.credentialStatus,
    inspection_status: payload.inspectionStatus,
    capitation_status: payload.capitationStatus,
  };
  
  const created = await insertRow<ProvidersRow>('providers', row);
  await logAction({
    action: 'PROVIDER_REGISTERED',
    entity: 'providers',
    entityId: created.id,
    metadata: { providerName: payload.providerName, providerCode: payload.providerCode }
  });
  return created;
}

export async function updateDirectoryProvider(id: string, payload: Partial<ProviderDirectoryItem>) {
  if (useMockData) {
    return updateProviderMock(id, payload);
  }
  
  const row: Partial<ProvidersRow> = {};
  if (payload.providerCode) row.provider_code = payload.providerCode;
  if (payload.providerName) row.provider_name = payload.providerName;
  if (payload.category) row.category = payload.category;
  if (payload.subcategory) row.subcategory = payload.subcategory;
  if (payload.ownership) row.ownership = payload.ownership;
  if (payload.lga) row.lga = payload.lga;
  if (payload.state) row.state = payload.state;
  if (payload.status) row.status = payload.status;
  
  const updated = await updateRow<ProvidersRow>('providers', id, row);
  await logAction({
    action: 'PROVIDER_DIRECTORY_UPDATED',
    entity: 'providers',
    entityId: id,
    metadata: { changes: payload }
  });
  return updated;
}

export async function setProviderLifecycleStatus(id: string, status: ProviderLifecycleStatus) {
  if (useMockData) {
    return setProviderStatusMock(id, status);
  }
  const updated = await updateRow<ProvidersRow>('providers', id, { status });
  await logAction({
    action: 'PROVIDER_STATUS_CHANGED',
    entity: 'providers',
    entityId: id,
    metadata: { newStatus: status }
  });
  return updated;
}

export async function getProviderProfile(providerId: string): Promise<ProviderProfile> {
  if (useMockData) {
    const profile = providerProfiles.find(provider => provider.id === providerId);
    if (!profile) throw new Error('Provider profile not found');
    return profile;
  }
  
  const provider = await fetchSingle<ProvidersRow>('providers', 'id', providerId);
  
  // Map Supabase row to UI type
  return {
    id: provider.id,
    providerCode: provider.provider_code,
    providerName: provider.provider_name,
    category: provider.category as any,
    subcategory: provider.subcategory || '',
    ownership: provider.ownership as any,
    lga: provider.lga,
    state: provider.state,
    contactPerson: provider.contact_person || '',
    phone: provider.phone || '',
    email: provider.email || '',
    status: provider.status as ProviderLifecycleStatus,
    contractStatus: provider.contract_status as any,
    credentialStatus: provider.credential_status as any,
    inspectionStatus: provider.inspection_status as any,
    capitationStatus: provider.capitation_status as any,
    inspectionRating: provider.inspection_rating || '',
    lastInspectionDate: provider.last_inspection_date || '',
    address: provider.address || '',
    bankName: provider.bank_name || '',
    accountName: provider.account_name || '',
    accountNumber: provider.account_number || '',
    services: [], // Would fetch from related tables in real DB
    departments: [],
    staffStrength: 0,
    equipment: [],
    documents: [],
    timeline: [],
    performance: {
      inspectionRating: 0,
      complaintScore: 0,
      utilization: 0,
      claimsTrend: 'stable',
      capitationTrend: 'stable',
      compliance: 0
    },
    communicationHistory: []
  };
}

export async function getProviderRegistrationDraft() {
  if (useMockData) {
    return providerRegistrationDraft;
  }
  return providerRegistrationDraft;
}

export async function getProviderContacts(providerId: string) {
  if (useMockData) {
    return apiMocks.getProviderContacts(providerId);
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('provider_contacts').select('*').eq('provider_id', providerId);
  if (error) {
    throw formatSupabaseError(error);
  }

  return data;
}

export async function getProviderFacilities(providerId: string) {
  if (useMockData) {
    return apiMocks.getProviderFacilities(providerId);
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('facilities').select('*').eq('provider_id', providerId);
  if (error) {
    throw formatSupabaseError(error);
  }

  return data;
}

/**
 * Provider Match Resolution Persistence
 */

export async function saveProviderMatchResolution(match: ProviderMatch, resolvedBy?: string) {
  if (useMockData) {
    console.log('[Mock] Saving provider match resolution:', match);
    return;
  }

  const row: Partial<ProviderMatchResolutionsRow> = {
    excel_name: match.excelName,
    matched_provider_id: match.matchedProviderId,
    matched_provider_name: match.matchedProviderName,
    matched_provider_code: match.matchedProviderCode,
    match_type: match.matchType,
    resolved_by: resolvedBy || 'system',
  };

  const saved = await upsertRow<ProviderMatchResolutionsRow>('provider_match_resolutions', row);
  
  await logAction({
    action: 'PROVIDER_MATCH_RESOLVED',
    entity: 'provider_match_resolutions',
    entityId: saved.id,
    metadata: { excelName: match.excelName, matchedProviderName: match.matchedProviderName }
  });
  
  return saved;
}

export async function getPersistedProviderMatches(): Promise<Record<string, ProviderMatch>> {
  if (useMockData) return {};

  const resolutions = await fetchTable<ProviderMatchResolutionsRow>('provider_match_resolutions');
  const matchMap: Record<string, ProviderMatch> = {};

  resolutions.forEach(r => {
    matchMap[r.excel_name.toLowerCase().trim()] = {
      excelName: r.excel_name,
      matchedProviderId: r.matched_provider_id || undefined,
      matchedProviderName: r.matched_provider_name || undefined,
      matchedProviderCode: r.matched_provider_code || undefined,
      confidence: 1,
      matchType: r.match_type as any,
      status: 'confirmed'
    };
  });

  return matchMap;
}
