import {
  Json,
  ProvidersRow,
  ProviderContactsRow,
  FacilitiesRow,
  CredentialingRow,
  ContractsRow,
  CapitationRow,
  CapitationUploadRow,
  InspectionsRow,
  NotificationsRow,
  SettingsRow,
} from '../lib/supabase/database.types';

const providers: ProvidersRow[] = [];
const providerContacts: ProviderContactsRow[] = [];
const facilities: FacilitiesRow[] = [];
const credentialingRequests: CredentialingRow[] = [];
const contracts: ContractsRow[] = [];
const capitations: CapitationRow[] = [];
const capitationUploads: CapitationUploadRow[] = [];
const inspections: InspectionsRow[] = [];
const notifications: NotificationsRow[] = [];
const settings: SettingsRow[] = [];

export async function getProviders() { return providers; }
export async function getProviderById(id: string) { return providers.find(p => p.id === id) as ProvidersRow; }
export async function createProvider(payload: any) { return {} as any; }
export async function updateProvider(id: string, payload: any) { return {} as any; }
export async function deleteProvider(id: string) { return true; }
export async function getProviderContacts(providerId: string) { return []; }
export async function getProviderFacilities(providerId: string) { return []; }
export async function getCredentialingRequests() { return []; }
export async function getCredentialingById(id: string) { return {} as any; }
export async function updateCredentialing(id: string, payload: any) { return {} as any; }
export async function getContracts() { return []; }
export async function getContractById(id: string) { return {} as any; }
export async function createContract(payload: any) { return {} as any; }
export async function updateContract(id: string, payload: any) { return {} as any; }
export async function getCapitations() { return []; }
export async function getCapitationById(id: string) { return {} as any; }
export async function createCapitation(payload: any) { return {} as any; }
export async function uploadCapitationFile(payload: any) { return {} as any; }
export async function getInspections() { return []; }
export async function getInspectionById(id: string) { return null; }
export async function getInspectionChecklist(inspectionId: string) { return []; }
export async function updateInspection(id: string, payload: any) { return {} as any; }
export async function getNotifications() { return []; }
export async function markNotificationRead(id: string) { return {} as any; }
export async function getSettings() { return []; }
export async function getSettingByKey(key: string) { return {} as any; }
export async function updateSetting(key: string, value: Json) { return {} as any; }
