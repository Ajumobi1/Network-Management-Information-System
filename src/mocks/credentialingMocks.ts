import { CredentialingApplication, CredentialingStatus } from '../types/credentialing/credentialingTypes';
import { ProviderCategory, ProviderOwnership } from '../types/providers/providerTypes';

export const credentialingApplicationsMock: CredentialingApplication[] = [
  {
    id: 'cred-app-1',
    providerId: 'prov-1',
    providerCode: 'NMIS-LAG-001',
    providerName: 'Lagos Medical Center',
    category: ProviderCategory.Hospital,
    ownership: ProviderOwnership.Private,
    state: 'Lagos',
    lga: 'Eti-Osa',
    status: 'approved',
    applicationDate: '2025-06-15',
    expiryDate: '2027-06-15',
    reviewer: 'Dr. Elizabeth Cole',
    lastUpdated: '2025-06-20',
    notes: 'All specialist licenses and facility standards verified successfully.',
    documents: [
      { id: 'doc-1', name: 'Facility Operating License', type: 'License', documentNumber: 'LIC-2025-9921', issueDate: '2025-01-10', expiryDate: '2027-01-10', status: 'verified', uploadedDate: '2025-06-15', reviewer: 'Dr. Elizabeth Cole', notes: 'Verified with Ministry of Health.' },
      { id: 'doc-2', name: 'Tax Clearance Certificate', type: 'Tax', documentNumber: 'TCC-882190', issueDate: '2025-03-01', expiryDate: '2026-03-01', status: 'verified', uploadedDate: '2025-06-15', reviewer: 'Finance Desk', notes: 'Valid tax compliance.' },
    ],
    auditTrail: [
      { id: 'audit-1', date: '2025-06-15', user: 'Lagos Medical Center', action: 'Application Submitted', previousStatus: 'draft', newStatus: 'submitted' },
      { id: 'audit-2', date: '2025-06-18', user: 'Dr. Elizabeth Cole', action: 'Review Started', previousStatus: 'submitted', newStatus: 'under-review' },
      { id: 'audit-3', date: '2025-06-20', user: 'Dr. Elizabeth Cole', action: 'Application Approved', previousStatus: 'under-review', newStatus: 'approved', comment: 'All criteria met.' },
    ],
  },
  {
    id: 'cred-app-2',
    providerId: 'prov-2',
    providerCode: 'NMIS-FCT-014',
    providerName: 'Abuja Comprehensive PHC',
    category: ProviderCategory.PrimaryHealthCentre,
    ownership: ProviderOwnership.Public,
    state: 'FCT',
    lga: 'Municipal',
    status: 'under-review',
    applicationDate: '2026-07-01',
    expiryDate: '2028-07-01',
    reviewer: 'Pharm. Danladi Ahmed',
    lastUpdated: '2026-08-01',
    notes: 'Pending inspection report verification.',
    documents: [
      { id: 'doc-3', name: 'PHC Accreditation Certificate', type: 'Certificate', documentNumber: 'PHC-FCT-44', issueDate: '2024-05-12', expiryDate: '2026-05-12', status: 'pending', uploadedDate: '2026-07-01' },
    ],
    auditTrail: [
      { id: 'audit-4', date: '2026-07-01', user: 'Abuja PHC Admin', action: 'Submitted', previousStatus: 'draft', newStatus: 'submitted' },
      { id: 'audit-5', date: '2026-07-05', user: 'Pharm. Danladi Ahmed', action: 'Under Review', previousStatus: 'submitted', newStatus: 'under-review' },
    ],
  },
  {
    id: 'cred-app-3',
    providerId: 'prov-3',
    providerCode: 'NMIS-KAN-032',
    providerName: 'Kano Community Pharmacy',
    category: ProviderCategory.Pharmacy,
    ownership: ProviderOwnership.Corporate,
    state: 'Kano',
    lga: 'Nassarawa',
    status: 'additional-info-required',
    applicationDate: '2026-05-10',
    expiryDate: '2026-08-10',
    reviewer: 'Dr. Elizabeth Cole',
    lastUpdated: '2026-07-28',
    notes: 'Pharmacist council license expired; updated certificate required.',
    documents: [
      { id: 'doc-4', name: 'PCN Annual Practice Permit', type: 'License', documentNumber: 'PCN-9912', issueDate: '2024-04-01', expiryDate: '2026-04-01', status: 'expired', uploadedDate: '2026-05-10', notes: 'Expired permit.' },
    ],
    auditTrail: [
      { id: 'audit-6', date: '2026-05-10', user: 'Kano Pharmacy', action: 'Submitted', previousStatus: 'draft', newStatus: 'submitted' },
      { id: 'audit-7', date: '2026-07-28', user: 'Dr. Elizabeth Cole', action: 'Requested Information', previousStatus: 'under-review', newStatus: 'additional-info-required', comment: 'Please upload current PCN practice permit.' },
    ],
  },
  {
    id: 'cred-app-4',
    providerId: 'prov-4',
    providerCode: 'NMIS-RIV-008',
    providerName: 'Riverside Medical Laboratory',
    category: ProviderCategory.Laboratory,
    ownership: ProviderOwnership.Private,
    state: 'Rivers',
    lga: 'Port Harcourt',
    status: 'submitted',
    applicationDate: '2026-08-02',
    expiryDate: '2028-08-02',
    reviewer: 'Unassigned',
    lastUpdated: '2026-08-02',
    notes: 'New application awaiting reviewer assignment.',
    documents: [
      { id: 'doc-5', name: 'MLSCN Practice License', type: 'License', documentNumber: 'MLSCN-5521', issueDate: '2026-01-15', expiryDate: '2028-01-15', status: 'pending', uploadedDate: '2026-08-02' },
    ],
    auditTrail: [
      { id: 'audit-8', date: '2026-08-02', user: 'Riverside Lab', action: 'Submitted', previousStatus: 'draft', newStatus: 'submitted' },
    ],
  },
  {
    id: 'cred-app-5',
    providerId: 'prov-5',
    providerCode: 'NMIS-OYO-021',
    providerName: 'Ibadan Eye Specialist Centre',
    category: ProviderCategory.SpecialistCentre,
    ownership: ProviderOwnership.FaithBased,
    state: 'Oyo',
    lga: 'Ibadan North',
    status: 'approved',
    applicationDate: '2025-07-20',
    expiryDate: '2027-07-20',
    reviewer: 'Dr. Elizabeth Cole',
    lastUpdated: '2025-07-25',
    notes: 'Specialist ophthalmology credentials verified.',
    documents: [
      { id: 'doc-6', name: 'Specialist Board Certification', type: 'Certificate', documentNumber: 'MED-SPEC-110', issueDate: '2023-06-10', expiryDate: '2027-06-10', status: 'verified', uploadedDate: '2025-07-20', reviewer: 'Dr. Elizabeth Cole' },
    ],
    auditTrail: [
      { id: 'audit-9', date: '2025-07-20', user: 'Ibadan Eye', action: 'Submitted', previousStatus: 'draft', newStatus: 'submitted' },
      { id: 'audit-10', date: '2025-07-25', user: 'Dr. Elizabeth Cole', action: 'Approved', previousStatus: 'under-review', newStatus: 'approved' },
    ],
  },
];

export async function getCredentialingApplicationsMock(): Promise<CredentialingApplication[]> {
  return credentialingApplicationsMock;
}

export async function getCredentialingApplicationByIdMock(id: string): Promise<CredentialingApplication> {
  const app = credentialingApplicationsMock.find(a => a.id === id || a.providerId === id);
  if (!app) {
    throw new Error('Credentialing application not found');
  }
  return app;
}

export async function updateCredentialingStatusMock(id: string, status: CredentialingStatus, comment?: string, reviewer?: string): Promise<CredentialingApplication> {
  const index = credentialingApplicationsMock.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Credentialing application not found');

  const current = credentialingApplicationsMock[index];
  const previousStatus = current.status;

  current.status = status;
  current.lastUpdated = new Date().toISOString().split('T')[0];
  if (reviewer) current.reviewer = reviewer;
  if (comment) current.notes = comment;

  current.auditTrail.unshift({
    id: `audit-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    user: reviewer || 'NMIS Administrator',
    action: `Status changed to ${status}`,
    previousStatus,
    newStatus: status,
    comment,
  });

  return current;
}
