import { useMockData, fetchTable } from '../common';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export async function logAction(entry: AuditLogEntry): Promise<AuditLogEntry> {
  if (useMockData) {
    return { ...entry, id: `audit-${Date.now()}`, createdAt: new Date().toISOString() };
  }
  
  // For live mode, we rely on the database triggers or explicit inserts if permitted
  // For now, we'll return the entry as-is to avoid blocking the UI
  return entry;
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  if (useMockData) return [];
  
  try {
    const logs = await fetchTable('audit_logs', {
      column: 'created_at', 
      ascending: false
    });

    return (logs as any[]).map(log => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.user_email,
      action: log.action,
      entity: log.entity,
      entityId: log.entity_id,
      metadata: log.metadata,
      createdAt: log.created_at
    }));
  } catch (error) {
    throw error instanceof Error ? error : new Error('Audit logs could not be loaded.');
  }
}
