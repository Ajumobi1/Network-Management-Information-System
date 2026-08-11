import * as capitationRepository from '../../repositories/capitation';
import { CapitationRow, CapitationUploadRow } from '../../lib/supabase/database.types';

export async function fetchCapitations(): Promise<CapitationRow[]> {
  return capitationRepository.getCapitations();
}

export async function fetchCapitationById(id: string): Promise<CapitationRow> {
  return capitationRepository.getCapitationById(id);
}

export async function createCapitation(payload: Partial<CapitationRow>): Promise<CapitationRow> {
  return capitationRepository.createCapitation(payload);
}

export async function uploadCapitationFile(payload: Partial<CapitationUploadRow>): Promise<CapitationUploadRow> {
  return capitationRepository.uploadCapitationFile(payload);
}
