import { ProviderCategory, ProviderLifecycleStatus, ProviderOwnership, ProviderWorkflowStatus } from '../constants/providerNetwork';
import { ProviderDirectoryItem, ProviderProfile, ProviderRegistrationDraft } from '../types/providers/providerTypes';

export const providerDirectory: ProviderDirectoryItem[] = [
  {
    id: 'prov-1',
    providerCode: 'NMIS-LAG-001',
    providerName: 'Lagos Medical Center',
    category: ProviderCategory.Hospital,
    subcategory: 'Teaching Hospital',
    ownership: ProviderOwnership.Private,
    lga: 'Eti-Osa',
    state: 'Lagos',
    contactPerson: 'Dr. Ayesha Bello',
    phone: '+234 800 123 4567',
    email: 'info@lagosmed.org',
    status: ProviderLifecycleStatus.Active,
    contractStatus: ProviderWorkflowStatus.Complete,
    credentialStatus: ProviderWorkflowStatus.Complete,
    inspectionStatus: ProviderWorkflowStatus.Complete,
    capitationStatus: ProviderWorkflowStatus.Pending,
    inspectionRating: 'Excellent',
    lastInspectionDate: '2026-07-18',
  },
  {
    id: 'prov-2',
    providerCode: 'NMIS-FCT-014',
    providerName: 'Abuja Comprehensive PHC',
    category: ProviderCategory.PrimaryHealthCentre,
    subcategory: 'Comprehensive PHC',
    ownership: ProviderOwnership.Public,
    lga: 'Municipal',
    state: 'FCT',
    contactPerson: 'Tunde Akintola',
    phone: '+234 800 765 4321',
    email: 'contact@abujaphc.ng',
    status: ProviderLifecycleStatus.Pending,
    contractStatus: ProviderWorkflowStatus.InReview,
    credentialStatus: ProviderWorkflowStatus.Pending,
    inspectionStatus: ProviderWorkflowStatus.Flagged,
    capitationStatus: ProviderWorkflowStatus.NotStarted,
    inspectionRating: 'Fair',
    lastInspectionDate: '2026-06-29',
  },
  {
    id: 'prov-3',
    providerCode: 'NMIS-KAN-032',
    providerName: 'Kano Community Pharmacy',
    category: ProviderCategory.Pharmacy,
    subcategory: 'Community Pharmacy',
    ownership: ProviderOwnership.Corporate,
    lga: 'Nassarawa',
    state: 'Kano',
    contactPerson: 'Pharm. Musa Danladi',
    phone: '+234 802 555 0192',
    email: 'network@kanopharmacy.ng',
    status: ProviderLifecycleStatus.Suspended,
    contractStatus: ProviderWorkflowStatus.Expired,
    credentialStatus: ProviderWorkflowStatus.Expired,
    inspectionStatus: ProviderWorkflowStatus.Pending,
    capitationStatus: ProviderWorkflowStatus.Flagged,
    inspectionRating: 'Poor',
    lastInspectionDate: '2026-05-10',
  },
  {
    id: 'prov-4',
    providerCode: 'NMIS-RIV-008',
    providerName: 'Riverside Medical Laboratory',
    category: ProviderCategory.Laboratory,
    subcategory: 'Medical Laboratory',
    ownership: ProviderOwnership.Private,
    lga: 'Port Harcourt',
    state: 'Rivers',
    contactPerson: 'Ngozi Okafor',
    phone: '+234 803 222 1188',
    email: 'ops@riversidelab.ng',
    status: ProviderLifecycleStatus.Active,
    contractStatus: ProviderWorkflowStatus.Complete,
    credentialStatus: ProviderWorkflowStatus.InReview,
    inspectionStatus: ProviderWorkflowStatus.Complete,
    capitationStatus: ProviderWorkflowStatus.Complete,
    inspectionRating: 'Good',
    lastInspectionDate: '2026-08-01',
  },
  {
    id: 'prov-5',
    providerCode: 'NMIS-OYO-021',
    providerName: 'Ibadan Eye Specialist Centre',
    category: ProviderCategory.SpecialistCentre,
    subcategory: 'Eye Clinic',
    ownership: ProviderOwnership.FaithBased,
    lga: 'Ibadan North',
    state: 'Oyo',
    contactPerson: 'Dr. Kemi Adeyemi',
    phone: '+234 805 442 8899',
    email: 'care@ibadaneye.ng',
    status: ProviderLifecycleStatus.Active,
    contractStatus: ProviderWorkflowStatus.Complete,
    credentialStatus: ProviderWorkflowStatus.Complete,
    inspectionStatus: ProviderWorkflowStatus.Complete,
    capitationStatus: ProviderWorkflowStatus.Complete,
    inspectionRating: 'Excellent',
    lastInspectionDate: '2026-07-27',
  },
  {
    id: 'prov-6',
    providerCode: 'NMIS-ENU-017',
    providerName: 'Enugu CT Scan Centre',
    category: ProviderCategory.DiagnosticImagingCentre,
    subcategory: 'CT Scan Centre',
    ownership: ProviderOwnership.Ngo,
    lga: 'Enugu North',
    state: 'Enugu',
    contactPerson: 'Chinedu Eze',
    phone: '+234 806 101 4411',
    email: 'admin@enuguct.ng',
    status: ProviderLifecycleStatus.Expired,
    contractStatus: ProviderWorkflowStatus.Flagged,
    credentialStatus: ProviderWorkflowStatus.Expired,
    inspectionStatus: ProviderWorkflowStatus.Pending,
    capitationStatus: ProviderWorkflowStatus.NotStarted,
    inspectionRating: 'Fair',
    lastInspectionDate: '2026-04-14',
  },
  {
    id: 'prov-7',
    providerCode: 'NMIS-ABJ-099',
    providerName: 'National Referral Centre Abuja',
    category: ProviderCategory.ReferralCentre,
    subcategory: 'National Referral Centre',
    ownership: ProviderOwnership.Public,
    lga: 'Garki',
    state: 'FCT',
    contactPerson: 'Dr. Halima Sani',
    phone: '+234 809 778 3001',
    email: 'referrals@nrcabuja.ng',
    status: ProviderLifecycleStatus.Active,
    contractStatus: ProviderWorkflowStatus.InReview,
    credentialStatus: ProviderWorkflowStatus.Complete,
    inspectionStatus: ProviderWorkflowStatus.Complete,
    capitationStatus: ProviderWorkflowStatus.Pending,
    inspectionRating: 'Good',
    lastInspectionDate: '2026-08-03',
  },
];

export const providerProfiles: ProviderProfile[] = providerDirectory.map((provider, index) => ({
  ...provider,
  address: `${12 + index} Network Avenue, ${provider.state}`,
  services: ['General consultation', 'Emergency care', 'Diagnostics', 'Pharmacy'],
  departments: ['Outpatient', 'Inpatient', 'Laboratory', 'Finance'],
  staffStrength: 45 + index * 18,
  equipment: ['Ultrasound', 'X-Ray', 'Ambulance', 'Cold-chain storage'],
  bankName: 'NMIS Partner Bank',
  accountName: provider.providerName,
  accountNumber: `10${index}4458892`,
  performance: {
    inspectionRating: 92 - index * 5,
    complaintScore: 8 + index * 3,
    utilization: 72 + index * 3,
    claimsTrend: index % 2 === 0 ? '+7.2%' : '-2.4%',
    capitationTrend: index % 2 === 0 ? '+5.8%' : 'Review',
    compliance: 90 - index * 4,
  },
  documents: [
    { id: `${provider.id}-doc-1`, providerId: provider.id, type: 'Facility License', name: 'Facility operating license.pdf', expiryDate: '2027-03-31', version: 'v3', status: ProviderWorkflowStatus.Complete },
    { id: `${provider.id}-doc-2`, providerId: provider.id, type: 'Tax Clearance', name: 'Tax clearance certificate.pdf', expiryDate: '2026-12-31', version: 'v2', status: index === 2 ? ProviderWorkflowStatus.Expired : ProviderWorkflowStatus.Complete },
    { id: `${provider.id}-doc-3`, providerId: provider.id, type: 'Inspection Report', name: 'Latest inspection report.pdf', expiryDate: '2026-09-30', version: 'v1', status: provider.inspectionStatus },
  ],
  timeline: [
    { id: `${provider.id}-time-1`, date: '2026-08-01', title: 'Profile reviewed', description: 'Network officer reviewed provider profile completeness.', actor: 'Network Operations' },
    { id: `${provider.id}-time-2`, date: '2026-07-18', title: 'Inspection completed', description: 'Facility inspection report attached to provider record.', actor: 'Inspection Team' },
    { id: `${provider.id}-time-3`, date: '2026-07-02', title: 'Contract updated', description: 'Contract status synchronized with provider lifecycle.', actor: 'Contract Desk' },
  ],
  communicationHistory: [
    { id: `${provider.id}-comm-1`, date: '2026-08-03', title: 'Email sent', description: 'Compliance reminder sent to provider contact.', actor: 'Provider Relations' },
    { id: `${provider.id}-comm-2`, date: '2026-07-25', title: 'SMS notification', description: 'Inspection schedule confirmation delivered.', actor: 'NMIS Notifications' },
  ],
}));

export async function addProviderMock(newItem: Omit<ProviderDirectoryItem, 'id'>): Promise<ProviderDirectoryItem> {
  const id = `prov-${Date.now()}`;
  const item: ProviderDirectoryItem = { ...newItem, id };
  providerDirectory.unshift(item);

  const profile: ProviderProfile = {
    ...item,
    address: '10 Network Way, Capital City',
    services: ['General consultation', 'Diagnostics', 'Emergency'],
    departments: ['Outpatient', 'Pharmacy', 'Laboratory'],
    staffStrength: 30,
    equipment: ['Basic diagnostic kit', 'Vital sign monitors'],
    bankName: 'First National Bank',
    accountName: item.providerName,
    accountNumber: '0123456789',
    documents: [],
    timeline: [
      { id: `${id}-time-1`, date: new Date().toISOString().split('T')[0], title: 'Provider Registered', description: 'New provider successfully added to the NMIS directory.', actor: 'System Admin' },
    ],
    performance: {
      inspectionRating: 85,
      complaintScore: 5,
      utilization: 70,
      claimsTrend: '+5.0%',
      capitationTrend: 'Stable',
      compliance: 90,
    },
    communicationHistory: [],
  };
  providerProfiles.unshift(profile);
  return item;
}

export async function updateProviderMock(id: string, updates: Partial<ProviderDirectoryItem>): Promise<ProviderDirectoryItem> {
  const index = providerDirectory.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Provider not found');

  providerDirectory[index] = { ...providerDirectory[index], ...updates };

  const profileIndex = providerProfiles.findIndex(p => p.id === id);
  if (profileIndex !== -1) {
    providerProfiles[profileIndex] = { ...providerProfiles[profileIndex], ...updates };
  }

  return providerDirectory[index];
}

export async function setProviderStatusMock(id: string, status: ProviderLifecycleStatus): Promise<ProviderDirectoryItem> {
  return updateProviderMock(id, { status });
}

export const providerRegistrationDraft: ProviderRegistrationDraft = {
  basicInformation: { providerName: '', providerCode: '', email: '', phone: '' },
  facilityInformation: { category: '', subcategory: '', address: '', state: '', lga: '' },
  ownership: { ownershipType: '', registrationNumber: '', taxId: '' },
  medicalServices: [],
  departments: [],
  staffStrength: { doctors: '', nurses: '', admin: '' },
  equipment: [],
  bankDetails: { bankName: '', accountName: '', accountNumber: '' },
  documents: [],
};
