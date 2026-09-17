import {
  assertLifecycleTransition,
  assertProviderAdminAuthority,
  ProviderAdminError,
  validateProviderAdminCommand,
} from './providerAdmin.ts';

function expectFailure(expectedCode: string, callback: () => unknown): void {
  try {
    callback();
  } catch (error) {
    if (error instanceof ProviderAdminError && error.code === expectedCode) return;
    throw error;
  }
  throw new Error(`Expected ${expectedCode} failure.`);
}

const validRegister = {
  command: 'register',
  payload: {
    provider_code: 'NMIS-OND-001',
    provider_name: 'Ondo General Hospital',
    category: 'Hospital',
    subcategory: 'General Hospital',
    ownership: 'Public/Government',
    state: 'Ondo',
    lga: 'Akure South',
  },
};

Deno.test('super-admin with AAL2 passes trusted provider authority check', () => {
  assertProviderAdminAuthority({ userId: 'user', email: 'admin@nmis.org', role: 'super-admin', aal: 'aal2' });
});

Deno.test('super-admin with AAL1 is rejected', () => {
  expectFailure('AAL_REQUIRED', () => assertProviderAdminAuthority({ userId: 'user', email: null, role: 'super-admin', aal: 'aal1' }));
});

Deno.test('non-super-admin is rejected', () => {
  expectFailure('UNAUTHORIZED', () => assertProviderAdminAuthority({ userId: 'user', email: null, role: 'network-officer', aal: 'aal2' }));
});

Deno.test('valid register payload is normalized and accepted', () => {
  const command = validateProviderAdminCommand(validRegister);
  if (command.command !== 'register' || command.payload.provider_code !== 'NMIS-OND-001') throw new Error('Expected normalized register command.');
});

Deno.test('forged browser role is rejected as an unknown command field', () => {
  expectFailure('VALIDATION_ERROR', () => validateProviderAdminCommand({ ...validRegister, role: 'super-admin' }));
});

Deno.test('forged browser actor id is rejected', () => {
  expectFailure('VALIDATION_ERROR', () => validateProviderAdminCommand({ ...validRegister, actorId: 'forged-user' }));
});

Deno.test('forged browser email is rejected', () => {
  expectFailure('VALIDATION_ERROR', () => validateProviderAdminCommand({ ...validRegister, email: 'forged@nmis.org' }));
});

Deno.test('bank fields are rejected', () => {
  expectFailure('VALIDATION_ERROR', () => validateProviderAdminCommand({
    ...validRegister,
    payload: { ...validRegister.payload, bank_name: 'Unapproved Bank' },
  }));
});

Deno.test('arbitrary metadata is rejected', () => {
  expectFailure('VALIDATION_ERROR', () => validateProviderAdminCommand({
    ...validRegister,
    payload: { ...validRegister.payload, metadata: { forged: true } },
  }));
});

Deno.test('delete is rejected as an unsupported command', () => {
  expectFailure('VALIDATION_ERROR', () => validateProviderAdminCommand({ command: 'delete', providerId: '00000000-0000-4000-8000-000000000001', payload: {} }));
});

Deno.test('only active and inactive lifecycle values are accepted', () => {
  expectFailure('VALIDATION_ERROR', () => validateProviderAdminCommand({
    command: 'change_lifecycle',
    providerId: '00000000-0000-4000-8000-000000000001',
    payload: { status: 'suspended' },
  }));
});

Deno.test('only the existing active/inactive lifecycle transition is permitted', () => {
  assertLifecycleTransition('Active', 'inactive');
  assertLifecycleTransition('inactive', 'active');
  expectFailure('INVALID_LIFECYCLE_TRANSITION', () => assertLifecycleTransition('suspended', 'active'));
});
