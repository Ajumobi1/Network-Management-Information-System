export const NMIS_ROLES = [
  'super-admin',
  'executive',
  'head-of-network',
  'network-officer',
  'inspector',
  'finance',
  'claims',
  'customer-service',
  'provider',
] as const;

export type NmisRole = (typeof NMIS_ROLES)[number];

export type TrustedIdentity = {
  userId: string;
  role: NmisRole;
  aal: 'aal1' | 'aal2';
};

export function secureJson(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/**
 * Placeholder for the future verified-token implementation. It intentionally
 * does not decode a browser JWT or accept actor/email/role values from JSON.
 */
export function trustedWorkflowUnavailable(workflow: string): Response {
  return secureJson(503, {
    code: 'TRUSTED_OPERATION_REQUIRED',
    message: `${workflow} is not deployed until its security and operational contract is approved.`,
  });
}
