import { InspectionStatus, InspectionRating } from '../../lib/supabase/database.types';

export interface Inspection {
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
}

export interface InspectionChecklistItem {
  id: string;
  inspectionId: string;
  item: string;
  completed: boolean;
  comments: string | null;
}

export interface InspectionFilters {
  search?: string;
  status?: InspectionStatus | 'all';
  type?: string | 'all';
  rating?: InspectionRating | 'all';
}
