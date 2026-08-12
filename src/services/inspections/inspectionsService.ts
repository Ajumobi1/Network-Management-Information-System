import * as inspectionsRepository from '../../repositories/inspections';
import { Inspection, InspectionChecklistItem } from '../../types/inspections/inspectionsTypes';
import { InspectionsRow } from '../../lib/supabase/database.types';

export async function fetchInspections(): Promise<Inspection[]> {
  const data = await inspectionsRepository.getInspections();
  return data as unknown as Inspection[];
}

export async function fetchInspectionById(id: string): Promise<Inspection> {
  const data = await inspectionsRepository.getInspectionById(id);
  return data as unknown as Inspection;
}

export async function fetchInspectionChecklist(inspectionId: string): Promise<InspectionChecklistItem[]> {
  const data = await inspectionsRepository.getInspectionChecklist(inspectionId);
  return data as unknown as InspectionChecklistItem[];
}

export async function updateInspection(id: string, payload: Partial<InspectionsRow>): Promise<Inspection> {
  const data = await inspectionsRepository.updateInspection(id, payload);
  return data as unknown as Inspection;
}
