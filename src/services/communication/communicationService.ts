import { communicationRepository } from '../../repositories/communication/communicationRepository';
import { CommunicationFilters, ProviderCommunication, CommunicationType, CommunicationChannel, CommunicationPriority } from '../../types/communication/communicationTypes';

export const communicationService = {
  async getCommunications(filters: CommunicationFilters): Promise<ProviderCommunication[]> {
    return communicationRepository.fetchCommunications(filters);
  },

  async createCommunication(payload: {
    providerId: string;
    type: CommunicationType;
    subject: string;
    message: string;
    channel: CommunicationChannel;
    priority?: CommunicationPriority;
    assignedOfficer?: string;
    followUpDate?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<string> {
    if (!payload.subject.trim()) throw new Error('Subject is required');
    if (!payload.message.trim()) throw new Error('Message is required');
    return communicationRepository.createCommunication(payload);
  },

  async completeFollowUp(id: string): Promise<boolean> {
    return communicationRepository.completeFollowUp(id);
  }
};
