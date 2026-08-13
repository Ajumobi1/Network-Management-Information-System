import type { NmisRole } from './security.ts';

export const PROVIDER_ADMIN_COMMANDS = ['register', 'edit_operational', 'change_lifecycle'] as const;
export type ProviderAdminCommand = (typeof PROVIDER_ADMIN_COMMANDS)[number];

export type ProviderDirectoryDto = {
  id: string;
  provider_code: string;
  provider_name: string;
  category: string;
  subcategory: string | null;
  ownership: string;
  state: string;
  lga: string;
  status: string;
  contract_status: string;
  credential_status: string;
  inspection_status: string;
  capitation_status: string;
  inspection_rating: string | null;
  last_inspection_date: string | null;
};

export type TrustedProviderIdentity = {
  userId: string;
  email: string | null;
  role: NmisRole;
  aal: 'aal1' | 'aal2';
};

export type ProviderAdminFailureCode =
  | 'UNAUTHORIZED'
  | 'AAL_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_PROVIDER'
  | 'PROVIDER_NOT_FOUND'
  | 'INVALID_LIFECYCLE_TRANSITION'
  | 'AUDIT_FAILURE'
  | 'INTERNAL_ERROR';

export class ProviderAdminError extends Error {
  constructor(
    readonly code: ProviderAdminFailureCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ProviderAdminError';
  }
}

export type RegisterProviderPayload = {
  provider_code?: string | null;
  provider_name: string;
  category: string;
  subcategory: string | null;
  ownership: string;
  state: string;
  lga: string;
  address?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
};

export type EditProviderPayload = {
  provider_name?: string;
  category?: string;
  subcategory?: string | null;
  ownership?: string;
  state?: string;
  lga?: string;
  address?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
};

export type LifecyclePayload = {
  status: 'active' | 'inactive';
};

export type ValidatedProviderAdminCommand =
  | { command: 'register'; providerId: null; payload: RegisterProviderPayload }
  | { command: 'edit_operational'; providerId: string; payload: EditProviderPayload }
  | { command: 'change_lifecycle'; providerId: string; payload: LifecyclePayload };

const categories = new Set([
  'Hospital',
  'Primary Health Centre (PHC)',
  'Pharmacy',
  'Laboratory',
  'Specialist Centre',
  'Diagnostic & Imaging Centre',
  'Referral Centre',
]);

const ownerships = new Set([
  'Government',
  'Private',
]);

const providerCodePattern = /^[A-Za-z0-9][A-Za-z0-9/_-]{2,63}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validationError(message: string): never {
  throw new ProviderAdminError('VALIDATION_ERROR', message, 400);
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) validationError(`The '${key}' field is not permitted for this provider command.`);
  }
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') validationError(`The '${field}' field is required.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) validationError(`The '${field}' field is invalid.`);
  return normalized;
}

function optionalString(value: unknown, field: string, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') validationError(`The '${field}' field is invalid.`);
  const normalized = value.trim();
  if (normalized.length > maxLength) validationError(`The '${field}' field is invalid.`);
  return normalized || null;
}

function providerId(value: unknown): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) validationError('A valid providerId is required.');
  return value;
}

function command(value: unknown): ProviderAdminCommand {
  if (typeof value !== 'string' || !PROVIDER_ADMIN_COMMANDS.includes(value as ProviderAdminCommand)) {
    validationError('The provider command is not supported.');
  }
  return value as ProviderAdminCommand;
}

export function assertProviderAdminAuthority(identity: TrustedProviderIdentity): void {
  if (identity.role !== 'super-admin') {
    throw new ProviderAdminError('UNAUTHORIZED', 'Provider administration is restricted to super-administrators.', 403);
  }
  if (identity.aal !== 'aal2') {
    throw new ProviderAdminError('AAL_REQUIRED', 'Multi-factor authentication is required for provider administration.', 403);
  }
}

export function validateProviderAdminCommand(input: unknown): ValidatedProviderAdminCommand {
  if (!isRecord(input)) validationError('A provider command object is required.');
  assertExactKeys(input, ['command', 'providerId', 'payload']);

  const action = command(input.command);
  if (!isRecord(input.payload)) validationError('A provider payload object is required.');

  if (action === 'register') {
    if (input.providerId !== undefined && input.providerId !== null) validationError('providerId is not allowed for provider registration.');
    assertExactKeys(input.payload, ['provider_code', 'provider_name', 'category', 'subcategory', 'ownership', 'state', 'lga', 'address', 'contact_person', 'phone', 'email', 'bank_name', 'account_name', 'account_number']);

    const provider_code = optionalString(input.payload.provider_code, 'provider_code', 64)?.toUpperCase();
    if (provider_code && !providerCodePattern.test(provider_code)) validationError('The provider_code format is invalid.');
    const provider_name = requiredString(input.payload.provider_name, 'provider_name', 160);
    const category = requiredString(input.payload.category, 'category', 120);
    const ownership = requiredString(input.payload.ownership, 'ownership', 120);
    const state = requiredString(input.payload.state, 'state', 120);
    const lga = requiredString(input.payload.lga, 'lga', 120);
    const subcategory = optionalString(input.payload.subcategory, 'subcategory', 160) ?? null;
    const address = optionalString(input.payload.address, 'address', 255);
    const contact_person = optionalString(input.payload.contact_person, 'contact_person', 160);
    const phone = optionalString(input.payload.phone, 'phone', 32);
    const email = optionalString(input.payload.email, 'email', 160);
    const bank_name = optionalString(input.payload.bank_name, 'bank_name', 160);
    const account_name = optionalString(input.payload.account_name, 'account_name', 160);
    const account_number = optionalString(input.payload.account_number, 'account_number', 32);

    if (!categories.has(category)) validationError('The provider category is invalid.');
    if (!ownerships.has(ownership)) validationError('The provider ownership is invalid.');

    return { command: 'register', providerId: null, payload: { provider_code, provider_name, category, subcategory, ownership, state, lga, address, contact_person, phone, email, bank_name, account_name, account_number } };
  }

  const id = providerId(input.providerId);
  if (action === 'edit_operational') {
    assertExactKeys(input.payload, ['provider_name', 'category', 'subcategory', 'ownership', 'state', 'lga', 'address', 'contact_person', 'phone', 'email', 'bank_name', 'account_name', 'account_number']);
    const payload: EditProviderPayload = {};
    
    if ('provider_name' in input.payload) payload.provider_name = requiredString(input.payload.provider_name, 'provider_name', 160);
    if ('category' in input.payload) {
      payload.category = requiredString(input.payload.category, 'category', 120);
      if (!categories.has(payload.category)) validationError('The provider category is invalid.');
    }
    if ('ownership' in input.payload) {
      payload.ownership = requiredString(input.payload.ownership, 'ownership', 120);
      if (!ownerships.has(payload.ownership)) validationError('The provider ownership is invalid.');
    }
    
    const subcategory = optionalString(input.payload.subcategory, 'subcategory', 160);
    const state = optionalString(input.payload.state, 'state', 120);
    const lga = optionalString(input.payload.lga, 'lga', 120);
    const address = optionalString(input.payload.address, 'address', 255);
    const contact_person = optionalString(input.payload.contact_person, 'contact_person', 160);
    const phone = optionalString(input.payload.phone, 'phone', 32);
    const email = optionalString(input.payload.email, 'email', 160);
    const bank_name = optionalString(input.payload.bank_name, 'bank_name', 160);
    const account_name = optionalString(input.payload.account_name, 'account_name', 160);
    const account_number = optionalString(input.payload.account_number, 'account_number', 32);

    if (subcategory !== undefined) payload.subcategory = subcategory;
    if (state !== undefined) payload.state = state ?? undefined;
    if (lga !== undefined) payload.lga = lga ?? undefined;
    if (address !== undefined) payload.address = address;
    if (contact_person !== undefined) payload.contact_person = contact_person;
    if (phone !== undefined) payload.phone = phone;
    if (email !== undefined) payload.email = email;
    if (bank_name !== undefined) payload.bank_name = bank_name;
    if (account_name !== undefined) payload.account_name = account_name;
    if (account_number !== undefined) payload.account_number = account_number;

    if (Object.keys(payload).length === 0) validationError('At least one approved provider field is required.');
    return { command: 'edit_operational', providerId: id, payload };
  }

  assertExactKeys(input.payload, ['status']);
  const status = requiredString(input.payload.status, 'status', 20).toLowerCase();
  if (status !== 'active' && status !== 'inactive') validationError('Only active and inactive lifecycle states are approved for this workflow.');
  return { command: 'change_lifecycle', providerId: id, payload: { status } };
}

export function assertLifecycleTransition(current: string, next: LifecyclePayload['status']): void {
  const normalizedCurrent = current.trim().toLowerCase();
  if ((normalizedCurrent === 'active' && next === 'inactive') || (normalizedCurrent === 'inactive' && next === 'active')) return;
  throw new ProviderAdminError('INVALID_LIFECYCLE_TRANSITION', 'This lifecycle transition is not permitted by the approved provider workflow.', 409);
}
