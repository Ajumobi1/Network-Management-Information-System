export type CommunicationType = 'General' | 'Credentialing' | 'Inspection' | 'Complaint' | 'Financial' | 'Contract';
export type CommunicationChannel = 'Phone' | 'Email' | 'Letter' | 'Meeting' | 'SMS' | 'Portal' | 'Other';
export type CommunicationStatus = 'Open' | 'In Progress' | 'Awaiting Provider' | 'Awaiting Internal Action' | 'Resolved' | 'Closed';
export type CommunicationPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ProviderCommunication {
  id: string;
  providerId: string;
  providerName: string;
  providerCode: string;
  type: CommunicationType;
  subject: string;
  message: string;
  channel: CommunicationChannel;
  status: CommunicationStatus;
  priority: CommunicationPriority;
  assignedOfficer: string | null;
  communicationDate: string;
  followUpDate: string | null;
  followUpCompleted: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationFilters {
  search: string;
  providerId?: string;
  type: 'all' | CommunicationType;
  status: 'all' | CommunicationStatus;
  priority: 'all' | CommunicationPriority;
}
