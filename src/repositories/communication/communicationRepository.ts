import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import { ProviderCommunication, CommunicationFilters, CommunicationType, CommunicationChannel, CommunicationPriority } from '../../types/communication/communicationTypes';

let mockCommunications: ProviderCommunication[] = [
  {
    id: 'comm-1',
    providerId: 'prov-1',
    providerName: 'Sunvale Hospital',
    providerCode: 'OND/001/HSP',
    type: 'Credentialing',
    subject: 'Missing License Renewal',
    message: 'Facility was notified that their operating license expires in 30 days. Requested updated docs.',
    channel: 'Email',
    status: 'In Progress',
    priority: 'High',
    assignedOfficer: 'Officer Adebayo',
    communicationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    followUpCompleted: false,
    relatedEntityType: 'document',
    relatedEntityId: 'doc-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comm-2',
    providerId: 'prov-2',
    providerName: 'Atlas Pharmacy',
    providerCode: 'OND/002/PHM',
    type: 'Financial',
    subject: 'Capitation Discrepancy',
    message: 'Discussed the July capitation variance. Provider clarified the enrollee count difference.',
    channel: 'Phone',
    status: 'Resolved',
    priority: 'Medium',
    assignedOfficer: 'Officer Folake',
    communicationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    followUpDate: null,
    followUpCompleted: true,
    relatedEntityType: 'capitation',
    relatedEntityId: 'cap-456',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export interface DbCommunication {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_code: string;
  type: string;
  subject: string;
  message: string;
  channel: string;
  status: string;
  priority: string;
  assigned_officer: string | null;
  communication_date: string;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapRecord(c: DbCommunication): ProviderCommunication {
  return {
    id: c.id,
    providerId: c.provider_id,
    providerName: c.provider_name,
    providerCode: c.provider_code,
    type: c.type as any,
    subject: c.subject,
    message: c.message,
    channel: c.channel as any,
    status: c.status as any,
    priority: c.priority as any,
    assignedOfficer: c.assigned_officer,
    communicationDate: c.communication_date,
    followUpDate: c.follow_up_date,
    followUpCompleted: c.follow_up_completed,
    relatedEntityType: c.related_entity_type,
    relatedEntityId: c.related_entity_id,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export const communicationRepository = {
  async fetchCommunications(filters: CommunicationFilters): Promise<ProviderCommunication[]> {
    if (useMockData) {
      const q = filters.search.trim().toLowerCase();
      return mockCommunications.filter(c => {
        const matchesSearch = !q || c.subject.toLowerCase().includes(q) || c.message.toLowerCase().includes(q) || c.providerName.toLowerCase().includes(q);
        const matchesProvider = !filters.providerId || c.providerId === filters.providerId;
        const matchesType = filters.type === 'all' || c.type === filters.type;
        const matchesStatus = filters.status === 'all' || c.status === filters.status;
        const matchesPriority = filters.priority === 'all' || c.priority === filters.priority;
        return matchesSearch && matchesProvider && matchesType && matchesStatus && matchesPriority;
      });
    }

    const { data, error } = await supabase.rpc('nmis_list_provider_communications', {
      p_provider_id: filters.providerId || null,
      p_status: filters.status === 'all' ? null : filters.status,
      p_type: filters.type === 'all' ? null : filters.type,
      p_search: filters.search.trim() || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to list communications');
    }

    return (data || []).map(mapRecord);
  },

  async createCommunication(payload: {
    providerId: string;
    type: CommunicationType;
    subject: string;
    message: string;
    channel: CommunicationChannel;
    priority?: CommunicationPriority;
    assignedOfficer?: string;
    followUpDate?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<string> {
    if (useMockData) {
      const newId = `comm-${Date.now()}`;
      mockCommunications.unshift({
        id: newId,
        ...payload,
        providerName: 'Selected Facility',
        providerCode: 'OND/999/TST',
        status: 'Open',
        priority: payload.priority || 'Medium',
        assignedOfficer: payload.assignedOfficer || null,
        communicationDate: new Date().toISOString(),
        followUpDate: payload.followUpDate || null,
        followUpCompleted: false,
        relatedEntityType: payload.relatedEntityType || null,
        relatedEntityId: payload.relatedEntityId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return newId;
    }

    const { data, error } = await supabase.rpc('nmis_create_provider_communication', {
      p_provider_id: payload.providerId,
      p_type: payload.type,
      p_subject: payload.subject,
      p_message: payload.message,
      p_channel: payload.channel,
      p_priority: payload.priority || 'Medium',
      p_assigned_officer: payload.assignedOfficer || null,
      p_follow_up_date: payload.followUpDate || null,
      p_related_entity_type: payload.relatedEntityType || null,
      p_related_entity_id: payload.relatedEntityId || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to create communication');
    }

    return data;
  },

  async completeFollowUp(id: string): Promise<boolean> {
    if (useMockData) {
      const target = mockCommunications.find(c => c.id === id);
      if (target) {
        target.followUpCompleted = true;
        target.status = 'Resolved';
        target.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const { data, error } = await supabase.rpc('nmis_complete_communication_followup', {
      p_comm_id: id,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to complete follow-up');
    }

    return data;
  }
};
