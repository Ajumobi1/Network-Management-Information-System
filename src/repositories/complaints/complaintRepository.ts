import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import { ComplaintCategory, ComplaintFilters, ComplaintPriority, ComplaintRecord, ComplaintStatus, ComplaintHistoryItem } from '../../types/complaints/complaintTypes';

// Mock store for fallback
let mockComplaints: ComplaintRecord[] = [
  {
    id: 'comp-1',
    referenceNumber: 'ODCHC-2026-INT-C1',
    source: 'internal',
    providerId: 'prov-1',
    providerName: 'Sunvale Hospital',
    providerCode: 'OND/001/HSP',
    title: 'Late payment follow-up for Q2 Capitation',
    category: 'payment',
    priority: 'high',
    status: 'open',
    description: 'Capitation remittance for April and May has not reflected in the facility account.',
    resolutionNotes: null,
    assignedTo: 'Dr. Adebayo',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'comp-2',
    referenceNumber: 'ODCHC-2026-INT-C2',
    source: 'internal',
    providerId: 'prov-2',
    providerName: 'Atlas Pharmacy',
    providerCode: 'OND/002/PHM',
    title: 'Claim rejection complaint for prescription batch #402',
    category: 'claims',
    priority: 'medium',
    status: 'resolved',
    description: 'Claims rejected due to purported code mismatch which was verified correct.',
    resolutionNotes: 'Verified and re-queued for payment in next batch.',
    assignedTo: 'Mrs. Folake',
    createdAt: '2026-07-20T14:30:00Z',
    updatedAt: '2026-07-25T09:15:00Z',
  },
  {
    id: 'comp-3',
    referenceNumber: 'ODCHC-2026-INT-C3',
    source: 'internal',
    providerId: 'prov-3',
    providerName: 'Riverside Clinic',
    providerCode: 'OND/003/CLN',
    title: 'Inspection report delay after annual audit',
    category: 'inspection',
    priority: 'urgent',
    status: 'escalated',
    description: 'Annual facility inspection was completed 6 weeks ago without formal certification.',
    resolutionNotes: 'Escalated to Head of Quality Assurance.',
    assignedTo: 'Engr. Chukwu',
    createdAt: '2026-07-10T08:00:00Z',
    updatedAt: '2026-08-02T11:20:00Z',
  },
];

export interface ComplaintDbRecord {
  id: string;
  reference_number: string;
  source: 'internal' | 'public';
  provider_id: string | null;
  provider_name: string;
  provider_code: string | null;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  description: string;
  resolution_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintHistoryDbItem {
  id: string;
  status_from: string | null;
  status_to: string;
  notes: string | null;
  created_by_email: string;
  created_at: string;
}

function mapRecord(c: ComplaintDbRecord): ComplaintRecord {
  return {
    id: c.id,
    referenceNumber: c.reference_number,
    source: c.source,
    providerId: c.provider_id,
    providerName: c.provider_name,
    providerCode: c.provider_code,
    title: c.title,
    category: c.category,
    priority: c.priority,
    status: c.status,
    description: c.description,
    resolutionNotes: c.resolution_notes,
    assignedTo: c.assigned_to,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export const complaintRepository = {
  async fetchComplaints(filters: ComplaintFilters): Promise<ComplaintRecord[]> {
    if (useMockData) {
      const q = filters.search.trim().toLowerCase();
      return mockComplaints.filter(c => {
        const matchSearch = !q || [c.title, c.providerName, c.providerCode || '', c.description].some(v => v.toLowerCase().includes(q));
        const matchStatus = filters.status === 'all' || c.status === filters.status;
        const matchCategory = filters.category === 'all' || c.category === filters.category;
        const matchPriority = filters.priority === 'all' || c.priority === filters.priority;
        const matchProvider = !filters.providerId || c.providerId === filters.providerId;
        return matchSearch && matchStatus && matchCategory && matchPriority && matchProvider;
      });
    }

    const { data, error } = await supabase.rpc('nmis_list_complaints', {
      p_status: filters.status === 'all' ? null : filters.status,
      p_category: filters.category === 'all' ? null : filters.category,
      p_priority: filters.priority === 'all' ? null : filters.priority,
      p_search: filters.search.trim() || null,
      p_provider_id: filters.providerId || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to list complaints');
    }

    return (data || []).map(mapRecord);
  },

  async createComplaint(payload: {
    providerId: string;
    title: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    description: string;
    assignedTo?: string;
  }): Promise<string> {
    if (useMockData) {
      const newId = `comp-${Date.now()}`;
      mockComplaints.unshift({
        id: newId,
        referenceNumber: `ODCHC-2026-INT-${newId.slice(-5).toUpperCase()}`,
        source: 'internal',
        providerId: payload.providerId,
        providerName: 'Selected Facility',
        providerCode: 'OND/999/TST',
        title: payload.title,
        category: payload.category,
        priority: payload.priority,
        status: 'open',
        description: payload.description,
        resolutionNotes: null,
        assignedTo: payload.assignedTo || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return newId;
    }

    const { data, error } = await supabase.rpc('nmis_create_complaint', {
      p_provider_id: payload.providerId,
      p_title: payload.title,
      p_category: payload.category,
      p_priority: payload.priority,
      p_description: payload.description,
      p_assigned_to: payload.assignedTo || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to create complaint');
    }

    return data;
  },

  async updateComplaintStatus(id: string, status: ComplaintStatus, resolutionNotes?: string): Promise<boolean> {
    if (useMockData) {
      const target = mockComplaints.find(c => c.id === id);
      if (target) {
        target.status = status;
        if (resolutionNotes) target.resolutionNotes = resolutionNotes;
        target.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }

    const { data, error } = await supabase.rpc('nmis_update_complaint_status', {
      p_complaint_id: id,
      p_status: status,
      p_resolution_notes: resolutionNotes || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to update complaint status');
    }

    return data;
  },

  async fetchComplaintHistory(id: string): Promise<ComplaintHistoryItem[]> {
    if (useMockData) {
      return [];
    }

    const { data, error } = await supabase.rpc('nmis_get_complaint_history', {
      p_complaint_id: id,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to fetch complaint history');
    }

    return (data || []).map((h: ComplaintHistoryDbItem) => ({
      id: h.id,
      statusFrom: h.status_from,
      statusTo: h.status_to,
      notes: h.notes,
      createdByEmail: h.created_by_email,
      createdAt: h.created_at,
    }));
  }
};
