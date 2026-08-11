import * as inspectionsRepository from '../../repositories/inspections';
import { InspectionsRow, InspectionChecklistRow } from '../../lib/supabase/database.types';

export async function fetchInspections(): Promise<InspectionsRow[]> {
  return inspectionsRepository.getInspections();
}

export async function fetchInspectionById(id: string): Promise<InspectionsRow> {
  return inspectionsRepository.getInspectionById(id);
}

export async function fetchInspectionChecklist(inspectionId: string): Promise<InspectionChecklistRow[]> {
  return inspectionsRepository.getInspectionChecklist(inspectionId);
}

export async function updateInspection(id: string, payload: Partial<InspectionsRow>): Promise<InspectionsRow> {
  return inspectionsRepository.updateInspection(id, payload);
}
