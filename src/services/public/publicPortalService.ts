import { supabase } from '../../lib/supabase/supabaseClient';

export type PublicProvider = {
  id: string;
  providerCode: string;
  providerName: string;
  category: string;
  ownership: string;
  lga: string;
  state: string;
  services: string[];
};

export type PublicPortalSnapshot = {
  kpis: {
    registeredEnrollees: number;
    accreditedProviders: number;
    lgasCovered: number;
    capitationRate: number;
    hospitals: number;
    pharmacies: number;
    diagnosticCentres: number;
  };
  transparency: {
    byLga: Array<{ name: string; value: number }>;
    byCategory: Array<{ name: string; value: number }>;
  };
  featuredProviders: PublicProvider[];
  lastUpdated: string | null;
};

export type PublicComplaintPayload = {
  category: string;
  complainantName?: string;
  contactPhone?: string;
  contactEmail?: string;
  lga?: string;
  providerId?: string;
  description: string;
  incidentDate?: string;
  preferredContactMethod?: string;
};

export type PublicComplaintResult = {
  referenceNumber: string;
  status: string;
  submittedAt: string;
};

export type PublicComplaintStatus = {
  referenceNumber: string;
  category: string;
  providerName: string | null;
  status: string;
  submittedAt: string;
};

function mapProvider(row: any): PublicProvider {
  return {
    id: row.id,
    providerCode: row.provider_code ?? row.providerCode ?? '',
    providerName: row.provider_name ?? row.providerName ?? '',
    category: row.category ?? 'HOSPITAL',
    ownership: row.ownership ?? '',
    lga: row.lga ?? '',
    state: row.state ?? 'Ondo',
    services: Array.isArray(row.services) ? row.services : [],
  };
}

export const publicPortalService = {
  async getSnapshot(): Promise<PublicPortalSnapshot> {
    const { data, error } = await supabase.rpc('nmis_public_portal_snapshot');
    if (error) throw error;
    const snapshot = data ?? {};
    return {
      kpis: {
        registeredEnrollees: Number(snapshot.kpis?.registeredEnrollees ?? 0),
        accreditedProviders: Number(snapshot.kpis?.accreditedProviders ?? 0),
        lgasCovered: Number(snapshot.kpis?.lgasCovered ?? 0),
        capitationRate: Number(snapshot.kpis?.capitationRate ?? 0),
        hospitals: Number(snapshot.kpis?.hospitals ?? 0),
        pharmacies: Number(snapshot.kpis?.pharmacies ?? 0),
        diagnosticCentres: Number(snapshot.kpis?.diagnosticCentres ?? 0),
      },
      transparency: {
        byLga: Array.isArray(snapshot.transparency?.byLga) ? snapshot.transparency.byLga.map((item: any) => ({ name: item.name, value: Number(item.value) })) : [],
        byCategory: Array.isArray(snapshot.transparency?.byCategory) ? snapshot.transparency.byCategory.map((item: any) => ({ name: item.name, value: Number(item.value) })) : [],
      },
      featuredProviders: Array.isArray(snapshot.featuredProviders) ? snapshot.featuredProviders.map(mapProvider) : [],
      lastUpdated: snapshot.lastUpdated ?? null,
    };
  },

  async findProviders(filters: { search?: string; lga?: string; category?: string; service?: string } = {}): Promise<PublicProvider[]> {
    const { data, error } = await supabase.rpc('nmis_public_provider_directory', {
      p_search: filters.search || null,
      p_lga: filters.lga || null,
      p_category: filters.category || null,
      p_service: filters.service || null,
      p_limit: 48,
    });
    if (error) throw error;
    return Array.isArray(data) ? data.map(mapProvider) : [];
  },

  async submitComplaint(payload: PublicComplaintPayload): Promise<PublicComplaintResult> {
    const { data, error } = await supabase.rpc('nmis_public_submit_complaint', {
      p_category: payload.category,
      p_complainant_name: payload.complainantName || null,
      p_contact_phone: payload.contactPhone || null,
      p_contact_email: payload.contactEmail || null,
      p_lga: payload.lga || null,
      p_provider_id: payload.providerId || null,
      p_description: payload.description,
      p_incident_date: payload.incidentDate || null,
      p_preferred_contact_method: payload.preferredContactMethod || null,
    });
    if (error) throw error;
    return {
      referenceNumber: data?.referenceNumber ?? data?.reference_number ?? '',
      status: data?.status ?? 'Submitted',
      submittedAt: data?.submittedAt ?? data?.submitted_at ?? new Date().toISOString(),
    };
  },

  async trackComplaint(reference: string): Promise<PublicComplaintStatus | null> {
    const { data, error } = await supabase.rpc('nmis_public_track_complaint', { p_reference: reference });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      referenceNumber: row.reference_number ?? row.referenceNumber,
      category: row.category,
      providerName: row.provider_name ?? row.providerName ?? null,
      status: row.status,
      submittedAt: row.submitted_at ?? row.submittedAt,
    };
  },
};
