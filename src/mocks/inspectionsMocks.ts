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

export const mockInspections: InspectionRecord[] = [];

export async function getInspectionsMock(): Promise<InspectionRecord[]> {
  return [];
}

export async function getInspectionByIdMock(id: string): Promise<InspectionRecord | null> {
  return null;
}

export async function updateInspectionMock(id: string, updates: Partial<InspectionRecord>): Promise<InspectionRecord> {
  throw new Error('Inspection not found');
}
