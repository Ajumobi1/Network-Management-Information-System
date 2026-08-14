export const protectedNmisTables = [
  'providers',
  'provider_documents',
  'import_batches',
  'financial_records',
  'provider_match_resolutions',
  'audit_logs',
  'enrollees',
] as const;

export type ProtectedNmisTable = (typeof protectedNmisTables)[number];

export type SecureContractErrorCode =
  | 'ACCESS_RESTRICTED'
  | 'TRUSTED_OPERATION_REQUIRED'
  | 'SECURE_CONTRACT_UNAVAILABLE'
  | 'PII_ACCESS_NOT_APPROVED'
  | 'IMPORT_WORKFLOW_UNAVAILABLE'
  | 'UNAUTHORIZED'
  | 'AAL_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_PROVIDER'
  | 'PROVIDER_NOT_FOUND'
  | 'INVALID_LIFECYCLE_TRANSITION'
  | 'DEPENDENCY_CONFLICT'
  | 'AUDIT_FAILURE'
  | 'INTERNAL_ERROR';

export class SecureContractError extends Error {
  readonly code: SecureContractErrorCode;
  readonly contract?: string;

  constructor(code: SecureContractErrorCode, message: string, contract?: string) {
    super(message);
    this.name = 'SecureContractError';
    this.code = code;
    this.contract = contract;
  }
}

export function isSecureContractError(error: unknown): error is SecureContractError {
  return error instanceof SecureContractError;
}

export function secureContractUnavailable(contract: string, message = 'This secure data contract is not available in the current environment.'): SecureContractError {
  return new SecureContractError('SECURE_CONTRACT_UNAVAILABLE', message, contract);
}

export function trustedOperationRequired(operation: string): SecureContractError {
  return new SecureContractError(
    'TRUSTED_OPERATION_REQUIRED',
    `${operation} requires an approved trusted server workflow and is unavailable from the browser.`,
    operation,
  );
}

export function piiAccessNotApproved(resource: string): SecureContractError {
  return new SecureContractError(
    'PII_ACCESS_NOT_APPROVED',
    `Access to ${resource} is not approved for direct browser use.`,
    resource,
  );
}

export function accessRestricted(resource: string): SecureContractError {
  return new SecureContractError('ACCESS_RESTRICTED', `Access to ${resource} is restricted by NMIS security policy.`, resource);
}

export function importWorkflowUnavailable(): SecureContractError {
  return new SecureContractError(
    'IMPORT_WORKFLOW_UNAVAILABLE',
    'Live import commit is unavailable until the approved trusted import workflow is deployed.',
    'nmis-import',
  );
}

const providerWorkflowMessages: Record<Extract<SecureContractErrorCode,
  'UNAUTHORIZED' | 'AAL_REQUIRED' | 'VALIDATION_ERROR' | 'DUPLICATE_PROVIDER' |
  'PROVIDER_NOT_FOUND' | 'INVALID_LIFECYCLE_TRANSITION' | 'DEPENDENCY_CONFLICT' | 'AUDIT_FAILURE' | 'INTERNAL_ERROR'
>, string> = {
  UNAUTHORIZED: 'You are not authorized to perform this provider operation.',
  AAL_REQUIRED: 'Complete multi-factor authentication before performing this provider operation.',
  VALIDATION_ERROR: 'The provider details do not satisfy the approved operational requirements.',
  DUPLICATE_PROVIDER: 'A provider with this provider code already exists.',
  PROVIDER_NOT_FOUND: 'The requested provider was not found.',
  INVALID_LIFECYCLE_TRANSITION: 'This provider lifecycle transition is not permitted.',
  DEPENDENCY_CONFLICT: 'This provider has historical operational records and cannot be permanently deleted. Change the provider status to Inactive instead.',
  AUDIT_FAILURE: 'The provider operation was not completed because its authoritative audit event could not be recorded.',
  INTERNAL_ERROR: 'The trusted provider workflow could not complete the operation.',
};

export function providerWorkflowError(
  code: keyof typeof providerWorkflowMessages,
  contract = 'nmis-provider-admin',
): SecureContractError {
  return new SecureContractError(code, providerWorkflowMessages[code], contract);
}

export function isProtectedNmisTable(table: string): table is ProtectedNmisTable {
  return (protectedNmisTables as readonly string[]).includes(table);
}
