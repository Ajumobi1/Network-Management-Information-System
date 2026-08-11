import { useMockData } from '../common';
import { getCredentialingApplicationsMock, getCredentialingApplicationByIdMock, updateCredentialingStatusMock } from '../../mocks/credentialingMocks';
import { CredentialingApplication, CredentialingStatus, CredentialingFilters } from '../../types/credentialing/credentialingTypes';
import { CredentialingRow } from '../../lib/supabase/database.types';

export async function getCredentialingApplications(filters?: CredentialingFilters): Promise<CredentialingApplication[]> {
  const apps = await getCredentialingApplicationsMock();
  if (!filters) return apps;

  const searchTerm = filters.search.trim().toLowerCase();
  return apps.filter(app => {
    const matchesSearch =
      !searchTerm ||
      [app.providerName, app.providerCode, app.reviewer, app.state, app.lga]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm);
    const matchesStatus = filters.status === 'all' || app.status === filters.status;
    const matchesCategory = filters.category === 'all' || app.category === filters.category;
    const matchesOwnership = filters.ownership === 'all' || app.ownership === filters.ownership;
    const matchesState = filters.state === 'all' || app.state === filters.state;

    return matchesSearch && matchesStatus && matchesCategory && matchesOwnership && matchesState;
  });
}

export async function getCredentialingApplicationById(id: string): Promise<CredentialingApplication> {
  return getCredentialingApplicationByIdMock(id);
}

export async function updateCredentialingStatus(id: string, status: CredentialingStatus, comment?: string, reviewer?: string): Promise<CredentialingApplication> {
  return updateCredentialingStatusMock(id, status, comment, reviewer);
}
