// PENDING LIVE VERIFICATION — contract only; no Storage or database operation.
// The trusted nmis-import function must use this state vocabulary after the
// owner approves source-file policy and the staging migration is applied.

export const IMPORT_STATES = [
  'uploaded',
  'validating',
  'validation-required',
  'ready-for-review',
  'match-review',
  'approved',
  'importing',
  'imported',
  'reconciled',
  'rejected',
  'failed',
  'superseded',
] as const;

export type ImportState = typeof IMPORT_STATES[number];

const ALLOWED_TRANSITIONS: Readonly<Record<ImportState, readonly ImportState[]>> = {
  uploaded: ['validating', 'rejected', 'failed'],
  validating: ['validation-required', 'ready-for-review', 'rejected', 'failed'],
  'validation-required': ['validating', 'rejected', 'failed'],
  'ready-for-review': ['match-review', 'approved', 'rejected', 'failed'],
  'match-review': ['ready-for-review', 'approved', 'rejected', 'failed'],
  approved: ['importing', 'rejected', 'failed'],
  importing: ['imported', 'failed'],
  imported: ['reconciled', 'superseded'],
  reconciled: ['superseded'],
  rejected: [],
  failed: ['validating', 'rejected'],
  superseded: [],
};

export type ImportValidationPolicy = {
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[];
  maxBytes: number;
  requiredSheets: readonly string[];
  requiredColumnsByDataType: Readonly<Record<string, readonly string[]>>;
  macroPolicy: 'reject' | 'quarantine' | 'allow-after-malware-scan';
};

export type SourceProvenance = {
  immutableObjectKey: string;
  sha256: string;
  originalFileName: string;
  byteSize: number;
  declaredMimeType: string;
  detectedMimeType?: string;
};

export function canTransitionImportState(from: ImportState, to: ImportState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertImportStateTransition(from: ImportState, to: ImportState): void {
  if (!canTransitionImportState(from, to)) {
    throw new Error(`Invalid import state transition: ${from} -> ${to}`);
  }
}

export function validateSourceProvenance(provenance: SourceProvenance): void {
  if (!/^[a-f0-9]{64}$/i.test(provenance.sha256)) {
    throw new Error('A SHA-256 source hash is required.');
  }
  if (!provenance.immutableObjectKey || !provenance.originalFileName || provenance.byteSize <= 0) {
    throw new Error('Complete immutable source provenance is required.');
  }
}
