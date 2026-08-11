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
  InspectionChecklistRow,
  NotificationsRow,
  SettingsRow,
} from '../lib/supabase/database.types';

const providers: ProvidersRow[] = [
  {
    id: 'prov-1',
    name: 'Lagos Medical Center',
    type: 'hospital',
    category_id: 'hospitals',
    status: 'active',
    phone: '+234 800 123 4567',
    email: 'info@lagosmed.org',
    address: '12 Victoria Island, Lagos',
    region: 'South',
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'prov-2',
    name: 'Abuja Health Hub',
    type: 'clinic',
    category_id: 'clinics',
    status: 'pending',
    phone: '+234 800 765 4321',
    email: 'contact@abujahealth.ng',
    address: '45 Central Business District, Abuja',
    region: 'North',
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

const providerContacts: ProviderContactsRow[] = [
  {
    id: 'contact-1',
    provider_id: 'prov-1',
    name: 'Dr. Ayesha Bello',
    role: 'Medical Director',
    email: 'ayesha.bello@lagosmed.org',
    phone: '+234 800 111 2222',
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'contact-2',
    provider_id: 'prov-2',
    name: 'Mr. Tunde Akintola',
    role: 'Operations Lead',
    email: 'tunde.akintola@abujahealth.ng',
    phone: '+234 800 333 4444',
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

const facilities: FacilitiesRow[] = [
  {
    id: 'fac-1',
    provider_id: 'prov-1',
    name: 'Lagos Medical Center - Main Wing',
    type: 'hospital',
    address: '12 Victoria Island, Lagos',
    region: 'South',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'fac-2',
    provider_id: 'prov-2',
    name: 'Abuja Health Hub - East Clinic',
    type: 'clinic',
    address: '45 Central Business District, Abuja',
    region: 'North',
    active: false,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

const credentialingRequests: CredentialingRow[] = [
  {
    id: 'cred-1',
    provider_id: 'prov-1',
    status: 'pending',
    requested_at: new Date().toISOString(),
    completed_at: null,
    reviewer_id: null,
    notes: 'Initial credentialing package submitted.',
  },
];

const contracts: ContractsRow[] = [
  {
    id: 'contract-1',
    provider_id: 'prov-1',
    status: 'active',
    start_date: '2025-01-01',
    end_date: '2026-01-01',
    value: 165000000,
    currency: 'NGN',
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

const capitations: CapitationRow[] = [
  {
    id: 'cap-1',
    provider_id: 'prov-1',
    period_start: '2025-07-01',
    period_end: '2025-07-31',
    amount: 12500000,
    currency: 'NGN',
    status: 'submitted',
    uploaded_at: new Date().toISOString(),
    approved_at: null,
  },
];

const capitationUploads: CapitationUploadRow[] = [
  {
    id: 'upload-1',
    capitation_id: 'cap-1',
    file_url: 'https://example.com/uploads/capitation-july.xlsx',
    file_name: 'capitation-july.xlsx',
    uploaded_by: 'finance-user',
    uploaded_at: new Date().toISOString(),
  },
];

const inspections: InspectionsRow[] = [
  {
    id: 'inspect-1',
    provider_id: 'prov-2',
    inspector_id: 'inspector-1',
    scheduled_at: '2025-08-12T10:00:00Z',
    completed_at: null,
    status: 'scheduled',
    rating: null,
    notes: null,
  },
];

const inspectionChecklists: InspectionChecklistRow[] = [
  {
    id: 'check-1',
    inspection_id: 'inspect-1',
    item: 'Facility cleanliness',
    completed: false,
    comments: null,
  },
];

const notifications: NotificationsRow[] = [
  {
    id: 'note-1',
    user_id: 'user-1',
    title: 'Provider contract pending approval',
    message: 'A contract for Lagos Medical Center requires executive approval.',
    read: false,
    level: 'warning',
    created_at: new Date().toISOString(),
  },
];

const settings: SettingsRow[] = [
  {
    id: 'setting-1',
    key: 'dashboard.theme',
    value: 'dark',
    updated_at: new Date().toISOString(),
  },
];

export async function getProviders() {
  return providers;
}

export async function getProviderById(id: string) {
  return providers.find(provider => provider.id === id) as ProvidersRow;
}

export async function createProvider(payload: Partial<ProvidersRow>) {
  const provider = {
    id: `prov-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: null,
  } as ProvidersRow;

  providers.push(provider);
  return provider;
}

export async function updateProvider(id: string, payload: Partial<ProvidersRow>) {
  const providerIndex = providers.findIndex(provider => provider.id === id);
  if (providerIndex === -1) {
    throw new Error('Provider not found');
  }

  providers[providerIndex] = {
    ...providers[providerIndex],
    ...payload,
    updated_at: new Date().toISOString(),
  } as ProvidersRow;

  return providers[providerIndex];
}

export async function deleteProvider(id: string) {
  const providerIndex = providers.findIndex(provider => provider.id === id);
  if (providerIndex === -1) {
    throw new Error('Provider not found');
  }

  providers.splice(providerIndex, 1);
  return true;
}

export async function getProviderContacts(providerId: string) {
  return providerContacts.filter(contact => contact.provider_id === providerId);
}

export async function getProviderFacilities(providerId: string) {
  return facilities.filter(facility => facility.provider_id === providerId);
}

export async function getCredentialingRequests() {
  return credentialingRequests;
}

export async function getCredentialingById(id: string) {
  return credentialingRequests.find(request => request.id === id) as CredentialingRow;
}

export async function updateCredentialing(id: string, payload: Partial<CredentialingRow>) {
  const index = credentialingRequests.findIndex(request => request.id === id);
  if (index === -1) {
    throw new Error('Credentialing request not found');
  }

  credentialingRequests[index] = {
    ...credentialingRequests[index],
    ...payload,
    updated_at: new Date().toISOString(),
  } as CredentialingRow;

  return credentialingRequests[index];
}

export async function getContracts() {
  return contracts;
}

export async function getContractById(id: string) {
  return contracts.find(contract => contract.id === id) as ContractsRow;
}

export async function createContract(payload: Partial<ContractsRow>) {
  const contract = {
    id: `contract-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: null,
  } as ContractsRow;

  contracts.push(contract);
  return contract;
}

export async function updateContract(id: string, payload: Partial<ContractsRow>) {
  const contractIndex = contracts.findIndex(contract => contract.id === id);
  if (contractIndex === -1) {
    throw new Error('Contract not found');
  }

  contracts[contractIndex] = {
    ...contracts[contractIndex],
    ...payload,
    updated_at: new Date().toISOString(),
  } as ContractsRow;

  return contracts[contractIndex];
}

export async function getCapitations() {
  return capitations;
}

export async function getCapitationById(id: string) {
  return capitations.find(capitation => capitation.id === id) as CapitationRow;
}

export async function createCapitation(payload: Partial<CapitationRow>) {
  const capitation = {
    id: `cap-${Date.now()}`,
    ...payload,
    uploaded_at: new Date().toISOString(),
    approved_at: null,
  } as CapitationRow;

  capitations.push(capitation);
  return capitation;
}

export async function uploadCapitationFile(payload: Partial<CapitationUploadRow>) {
  const upload = {
    id: `upload-${Date.now()}`,
    ...payload,
    uploaded_at: new Date().toISOString(),
  } as CapitationUploadRow;

  capitationUploads.push(upload);
  return upload;
}

export async function getInspections() {
  return inspections;
}

export async function getInspectionById(id: string) {
  return inspections.find(inspection => inspection.id === id) as InspectionsRow;
}

export async function getInspectionChecklist(inspectionId: string) {
  return inspectionChecklists.filter(checklist => checklist.inspection_id === inspectionId);
}

export async function updateInspection(id: string, payload: Partial<InspectionsRow>) {
  const index = inspections.findIndex(inspection => inspection.id === id);
  if (index === -1) {
    throw new Error('Inspection not found');
  }

  inspections[index] = {
    ...inspections[index],
    ...payload,
  } as InspectionsRow;

  return inspections[index];
}

export async function getNotifications() {
  return notifications;
}

export async function markNotificationRead(id: string) {
  const index = notifications.findIndex(notification => notification.id === id);
  if (index === -1) {
    throw new Error('Notification not found');
  }

  notifications[index] = {
    ...notifications[index],
    read: true,
  };

  return notifications[index];
}

export async function getSettings() {
  return settings;
}

export async function getSettingByKey(key: string) {
  return settings.find(setting => setting.key === key) as SettingsRow;
}

export async function updateSetting(key: string, value: Json) {
  const existingIndex = settings.findIndex(setting => setting.key === key);
  if (existingIndex >= 0) {
    settings[existingIndex] = {
      ...settings[existingIndex],
      value,
      updated_at: new Date().toISOString(),
    };
    return settings[existingIndex];
  }

  const newSetting = {
    id: `setting-${Date.now()}`,
    key,
    value,
    updated_at: new Date().toISOString(),
  } as SettingsRow;

  settings.push(newSetting);
  return newSetting;
}
