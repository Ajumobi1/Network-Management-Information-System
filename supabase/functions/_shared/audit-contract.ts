// PENDING LIVE VERIFICATION — contract only; no audit database write occurs here.
import type { NmisRole, TrustedIdentity } from './security.ts';

export const AUDIT_EVENT_CODES = [
  'ADMIN_INVITATION_REQUESTED',
  'ADMIN_ROLE_CHANGE_REQUESTED',
  'ADMIN_ACCOUNT_STATUS_CHANGE_REQUESTED',
  'IMPORT_SOURCE_RECEIVED',
  'IMPORT_VALIDATION_COMPLETED',
  'IMPORT_MATCH_REVIEW_COMPLETED',
  'IMPORT_APPROVED',
  'IMPORT_COMPLETED',
  'IMPORT_FAILED',
  'IMPORT_RECONCILED',
  'IMPORT_SUPERSEDED',
  'FINANCIAL_CORRECTION_REQUESTED',
] as const;

export type AuditEventCode = typeof AUDIT_EVENT_CODES[number];

export type TrustedAuditEvent = {
  eventCode: AuditEventCode;
  entityType: 'import_batch' | 'source_file' | 'provider_match' | 'financial_correction' | 'user_administration';
  entityId: string;
  correlationId: string;
  importBatchId?: string;
  sourceObjectKey?: string;
  reasonCode?: string;
  // Redacted, schema-constrained evidence only. Never accept raw PII, a browser
  // timestamp, a browser actor ID, or arbitrary before/after payloads.
  changeEvidence?: Record<string, string | number | boolean | null>;
};

export type DerivedAuditAttribution = {
  actorUserId: string;
  actorRole: NmisRole;
  occurredAt: 'database-generated';
};

export function deriveAuditAttribution(identity: TrustedIdentity): DerivedAuditAttribution {
  return {
    actorUserId: identity.user.id,
    actorRole: identity.role,
    occurredAt: 'database-generated',
  };
}

export function assertApprovedAuditEvent(event: TrustedAuditEvent): void {
  if (!AUDIT_EVENT_CODES.includes(event.eventCode)) {
    throw new Error('Unapproved audit event code.');
  }
  if (!event.entityId || !event.correlationId) {
    throw new Error('Audit entity and correlation identifiers are required.');
  }
}
