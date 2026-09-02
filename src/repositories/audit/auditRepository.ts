import { useMockData } from '../common';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';

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
  const logs = await invokeSecureRpc<Array<{
    id: string;
    user_id: string | null;
    user_email: string | null;
    action: string;
    entity: string;
    entity_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>>('nmis_list_audit_logs', { p_limit: 500, p_offset: 0 });

  return logs.map(log => ({
      id: log.id,
      userId: log.user_id || undefined,
      userEmail: log.user_email || undefined,
      action: log.action,
      entity: log.entity,
      entityId: log.entity_id || undefined,
      metadata: log.metadata || undefined,
      createdAt: log.created_at
  }));
}
