import { InspectionStatus, InspectionRating } from '../lib/supabase/database.types';

export interface InspectionRecord {
  id: string;
  providerId: string;
  providerName: string;
  providerCode: string;
  inspectorId: string;
  inspectorName: string;
  scheduledAt: string;
  completedAt: string | null;
  status: InspectionStatus;
  rating: InspectionRating | null;
  score: number | null;
  type: 'Clinical' | 'Compliance' | 'Safety' | 'Licensing' | 'Operational';
  notes: string | null;
  checklist: { id: string; item: string; completed: boolean; comments: string | null }[];
}

export const mockInspections: InspectionRecord[] = [
  {
    id: 'insp-1',
    providerId: 'prov-1',
    providerName: 'Lagos Medical Center',
    providerCode: 'NMIS-LAG-001',
    inspectorId: 'user-3',
    inspectorName: 'Field Inspector',
    scheduledAt: '2026-08-12T10:00:00Z',
    completedAt: '2026-08-12T14:30:00Z',
    status: 'completed',
    rating: 'excellent',
    score: 94,
    type: 'Clinical',
    notes: 'Facility maintains exceptional standards in clinical waste management and patient record digitalization.',
    checklist: [
      { id: 'chk-1-1', item: 'Clinical waste management protocol', completed: true, comments: 'Standard followed' },
      { id: 'chk-1-2', item: 'Patient record digitalization', completed: true, comments: '95% digital' },
      { id: 'chk-1-3', item: 'Emergency exit accessibility', completed: true, comments: null },
      { id: 'chk-1-4', item: 'Drug storage temperature control', completed: true, comments: 'Automated logging active' },
    ]
  },
  {
    id: 'insp-2',
    providerId: 'prov-2',
    providerName: 'Abuja Comprehensive PHC',
    providerCode: 'NMIS-FCT-014',
    inspectorId: 'user-3',
    inspectorName: 'Field Inspector',
    scheduledAt: '2026-08-14T09:00:00Z',
    completedAt: null,
    status: 'scheduled',
    rating: null,
    score: null,
    type: 'Compliance',
    notes: 'Routine quarterly compliance check.',
    checklist: [
      { id: 'chk-2-1', item: 'Valid operating license', completed: false, comments: null },
      { id: 'chk-2-2', item: 'Staff attendance registers', completed: false, comments: null },
      { id: 'chk-2-3', item: 'Equipment maintenance logs', completed: false, comments: null },
    ]
  },
  {
    id: 'insp-3',
    providerId: 'prov-3',
    providerName: 'Kano Community Pharmacy',
    providerCode: 'NMIS-KAN-032',
    inspectorId: 'user-3',
    inspectorName: 'Field Inspector',
    scheduledAt: '2026-08-18T11:00:00Z',
    completedAt: null,
    status: 'scheduled',
    rating: null,
    score: null,
    type: 'Safety',
    notes: 'Follow-up on previous fire safety recommendations.',
    checklist: [
      { id: 'chk-3-1', item: 'Fire extinguisher service tags', completed: false, comments: null },
      { id: 'chk-3-2', item: 'Smoke detector functionality', completed: false, comments: null },
    ]
  },
  {
    id: 'insp-4',
    providerId: 'prov-4',
    providerName: 'Riverside Medical Laboratory',
    providerCode: 'NMIS-RIV-008',
    inspectorId: 'user-3',
    inspectorName: 'Field Inspector',
    scheduledAt: '2026-08-10T13:00:00Z',
    completedAt: '2026-08-10T16:00:00Z',
    status: 'completed',
    rating: 'good',
    score: 88,
    type: 'Licensing',
    notes: 'All licenses are up to date. Minor issues with signage visibility.',
    checklist: [
      { id: 'chk-4-1', item: 'Current medical lab license', completed: true, comments: 'Expires 2027' },
      { id: 'chk-4-2', item: 'Signage visibility', completed: false, comments: 'Needs improvement' },
    ]
  },
  {
    id: 'insp-5',
    providerId: 'prov-5',
    providerName: 'Ibadan Eye Specialist Centre',
    providerCode: 'NMIS-OYO-021',
    inspectorId: 'user-3',
    inspectorName: 'Field Inspector',
    scheduledAt: '2026-08-05T10:00:00Z',
    completedAt: '2026-08-05T12:00:00Z',
    status: 'completed',
    rating: 'excellent',
    score: 96,
    type: 'Clinical',
    notes: 'Specialist equipment is state-of-the-art and well-maintained.',
    checklist: [
      { id: 'chk-5-1', item: 'Specialist equipment calibration', completed: true, comments: 'Done last month' },
      { id: 'chk-5-2', item: 'Patient privacy measures', completed: true, comments: 'Excellent' },
    ]
  },
  {
    id: 'insp-6',
    providerId: 'prov-6',
    providerName: 'Enugu CT Scan Centre',
    providerCode: 'NMIS-ENU-017',
    inspectorId: 'user-3',
    inspectorName: 'Field Inspector',
    scheduledAt: '2026-08-21T09:00:00Z',
    completedAt: null,
    status: 'scheduled',
    rating: null,
    score: null,
    type: 'Safety',
    notes: 'Radiation safety audit.',
    checklist: [
      { id: 'chk-6-1', item: 'Radiation shielding integrity', completed: false, comments: null },
      { id: 'chk-6-2', item: 'Lead apron availability', completed: false, comments: null },
    ]
  }
];

export async function getInspectionsMock(): Promise<InspectionRecord[]> {
  return [...mockInspections].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
}

export async function getInspectionByIdMock(id: string): Promise<InspectionRecord | null> {
  return mockInspections.find(i => i.id === id) || null;
}

export async function updateInspectionMock(id: string, updates: Partial<InspectionRecord>): Promise<InspectionRecord> {
  const index = mockInspections.findIndex(i => i.id === id);
  if (index === -1) throw new Error('Inspection not found');
  mockInspections[index] = { ...mockInspections[index], ...updates };
  return mockInspections[index];
}
