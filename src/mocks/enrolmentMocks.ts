import { EnrolleeRecord, EnrolmentFilters } from '../types/enrolment/enrolmentTypes';

export const mockEnrollees: EnrolleeRecord[] = [];

export async function getEnrolleesMock(filters: EnrolmentFilters = {}): Promise<EnrolleeRecord[]> {
  return [];
}

export async function getEnrolleeByIdMock(id: string): Promise<EnrolleeRecord> {
  throw new Error('Enrollee record not found');
}

export async function insertEnrolleesMock(records: EnrolleeRecord[]): Promise<EnrolleeRecord[]> {
  return [];
}
