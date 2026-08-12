import { secureJson, trustedWorkflowUnavailable } from '../_shared/security.ts';

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return secureJson(405, { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported.' });
  }

  // This is intentionally non-operative. It does not accept browser-supplied
  // actor/email/role/timestamps as authoritative, does not touch Storage, and
  // cannot create import batches, financial records, enrollee records, matches,
  // or audit logs before the required contracts are approved and deployed.
  return trustedWorkflowUnavailable('nmis-import');
});
