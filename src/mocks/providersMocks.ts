import { ProviderDirectoryItem, ProviderProfile, ProviderRegistrationDraft } from '../types/providers/providerTypes';

export const providerDirectory: ProviderDirectoryItem[] = [];

export const providerProfiles: ProviderProfile[] = [];

export async function addProviderMock(newItem: Omit<ProviderDirectoryItem, 'id'>): Promise<ProviderDirectoryItem> {
  const id = `prov-${Date.now()}`;
  const item: ProviderDirectoryItem = { ...newItem, id };
  providerDirectory.unshift(item);
  return item;
}

export async function updateProviderMock(id: string, updates: Partial<ProviderDirectoryItem>): Promise<ProviderDirectoryItem> {
  const index = providerDirectory.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Provider not found');
  providerDirectory[index] = { ...providerDirectory[index], ...updates };
  return providerDirectory[index];
}

export async function setProviderStatusMock(id: string, status: any): Promise<ProviderDirectoryItem> {
  return updateProviderMock(id, { status });
}

export const providerRegistrationDraft: ProviderRegistrationDraft = {
  basicInformation: { providerName: '', providerCode: '', email: '', phone: '' },
  facilityInformation: { category: '' as any, subcategory: '', address: '', state: '', lga: '' },
  ownership: { ownershipType: '' as any, registrationNumber: '', taxId: '' },
  medicalServices: [],
  departments: [],
  staffStrength: { doctors: '', nurses: '', admin: '' },
  equipment: [],
  bankDetails: { bankName: '', accountName: '', accountNumber: '' },
  documents: [],
};
