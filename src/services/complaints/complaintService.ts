import { complaintRepository } from '../../repositories/complaints/complaintRepository';
import { ComplaintFilters, ComplaintRecord, ComplaintStatus, ComplaintCategory, ComplaintPriority } from '../../types/complaints/complaintTypes';

export const complaintService = {
  async getComplaints(filters: ComplaintFilters): Promise<ComplaintRecord[]> {
    return complaintRepository.fetchComplaints(filters);
  },

  async createComplaint(payload: {
    providerId: string;
    title: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    description: string;
    assignedTo?: string;
  }): Promise<string> {
    if (!payload.title.trim()) throw new Error('Complaint title is required');
    if (!payload.description.trim()) throw new Error('Complaint description is required');
    return complaintRepository.createComplaint(payload);
  },

  async updateStatus(id: string, status: ComplaintStatus, resolutionNotes?: string): Promise<boolean> {
    if (status === 'resolved' && !resolutionNotes?.trim()) {
      throw new Error('Resolution notes are required when marking a complaint as resolved');
    }
    return complaintRepository.updateComplaintStatus(id, status, resolutionNotes);
  },

  async getComplaintHistory(id: string) {
    return complaintRepository.fetchComplaintHistory(id);
  },

  async getComplaintMessages(id: string) {
    return complaintRepository.fetchComplaintMessages(id);
  },

  async sendMessage(payload: {
    complaintId: string;
    senderType: 'staff' | 'complainant';
    senderName: string;
    senderEmail?: string;
    message: string;
  }) {
    if (!payload.message.trim()) throw new Error('Message cannot be empty');
    return complaintRepository.sendComplaintMessage(payload);
  }
};
