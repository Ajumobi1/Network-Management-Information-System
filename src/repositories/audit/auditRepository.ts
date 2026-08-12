import { useMockData, insertRow, fetchTable } from '../common';
import { AuditLogsRow } from '../../lib/supabase/database.types';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export async function logAction(entry: AuditLogEntry): Promise<AuditLogEntry> {
  const now = new Date().toISOString();

  if (useMockData) {
    console.log('[Audit Log (Mock)]', entry);
    return { ...entry, id: `audit-${Date.now()}`, createdAt: now };
  }

  const row: Partial<AuditLogsRow> = {
    user_id: entry.userId,
    user_email: entry.userEmail,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    metadata: entry.metadata as any,
  };

  const created = await insertRow<AuditLogsRow>('audit_logs', row);
  return {
    id: created.id,
    userId: created.user_id || undefined,
    userEmail: created.user_email || undefined,
    action: created.action,
    entity: created.entity,
    entityId: created.entity_id || undefined,
    metadata: created.metadata as Record<string, any>,
    createdAt: created.created_at,
  };
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  if (useMockData) {
    return [];
  }

  const logs = await fetchTable<AuditLogsRow>('audit_logs', { column: 'created_at', ascending: false });
  return logs.map(l => ({
    id: l.id,
    userId: l.user_id || undefined,
    userEmail: l.user_email || undefined,
    action: l.action,
    entity: l.entity,
    entityId: l.entity_id || undefined,
    metadata: l.metadata as Record<string, any>,
    createdAt: l.created_at,
  }));
}
