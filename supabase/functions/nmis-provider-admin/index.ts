import { createClient } from 'npm:@supabase/supabase-js@2';
import { NMIS_ROLES, type NmisRole } from '../_shared/security.ts';
import {
  assertProviderAdminAuthority,
  ProviderAdminError,
  type ProviderAdminFailureCode,
  type ProviderDirectoryDto,
  validateProviderAdminCommand,
} from '../_shared/providerAdmin.ts';

type VerifiedClaims = {
  aal?: unknown;
  app_metadata?: { nmis_role?: unknown } | null;
};

type ProviderAdminRpcResponse = {
  provider?: ProviderDirectoryDto;
};

function corsHeaders(request: Request): Record<string, string> {
  const allowedOrigin = Deno.env.get('NMIS_ALLOWED_ORIGIN');
  const requestOrigin = request.headers.get('origin');
  if (!allowedOrigin || requestOrigin !== allowedOrigin) return { 'vary': 'Origin' };
  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-headers': 'authorization, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'vary': 'Origin',
  };
}

function response(request: Request, status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function trustedFailure(request: Request, code: ProviderAdminFailureCode, status: number): Response {
  return response(request, status, { code });
}

function authorizationToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

function isNmisRole(value: unknown): value is NmisRole {
  return typeof value === 'string' && (NMIS_ROLES as readonly string[]).includes(value);
}

async function verifiedIdentity(request: Request) {
  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const token = authorizationToken(request);
  if (!url || !publishableKey || !token) throw new ProviderAdminError('UNAUTHORIZED', 'Unauthorized.', 401);

  const authClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [{ data: claimsData, error: claimsError }, { data: userData, error: userError }] = await Promise.all([
    authClient.auth.getClaims(token),
    authClient.auth.getUser(token),
  ]);
  if (claimsError || userError || !claimsData?.claims || !userData.user) {
    throw new ProviderAdminError('UNAUTHORIZED', 'Unauthorized.', 401);
  }

  const claims = claimsData.claims as VerifiedClaims;
  const role = claims.app_metadata?.nmis_role;
  const aal = claims.aal;
  if (!isNmisRole(role)) throw new ProviderAdminError('UNAUTHORIZED', 'Unauthorized.', 403);
  if (aal !== 'aal1' && aal !== 'aal2') throw new ProviderAdminError('UNAUTHORIZED', 'Unauthorized.', 401);
  const verifiedAal: 'aal1' | 'aal2' = aal;

  return {
    userId: userData.user.id,
    email: userData.user.email ?? null,
    role,
    aal: verifiedAal,
  };
}

function mapDatabaseError(error: { code?: string | null; message?: string | null }): ProviderAdminError {
  if (error.code === '23505') return new ProviderAdminError('DUPLICATE_PROVIDER', 'Duplicate provider.', 409);
  if (error.code === 'P0001') {
    const message = error.message ?? '';
    if (message.includes('PROVIDER_NOT_FOUND')) return new ProviderAdminError('PROVIDER_NOT_FOUND', 'Provider not found.', 404);
    if (message.includes('INVALID_LIFECYCLE_TRANSITION')) return new ProviderAdminError('INVALID_LIFECYCLE_TRANSITION', 'Invalid lifecycle transition.', 409);
    if (message.includes('DEPENDENCY_CONFLICT')) return new ProviderAdminError('DEPENDENCY_CONFLICT', message.replace('DEPENDENCY_CONFLICT: ', ''), 409);
    if (message.includes('AUDIT_FAILURE')) return new ProviderAdminError('AUDIT_FAILURE', 'Audit failure.', 500);
    if (message.includes('VALIDATION_ERROR')) return new ProviderAdminError('VALIDATION_ERROR', 'Validation failure.', 400);
  }
  return new ProviderAdminError('INTERNAL_ERROR', 'Provider operation failed.', 500);
}

Deno.serve(async request => {
  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') {
    if (!headers['access-control-allow-origin']) return response(request, 403, { code: 'UNAUTHORIZED' });
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') return response(request, 405, { code: 'METHOD_NOT_ALLOWED' });

  try {
    const identity = await verifiedIdentity(request);
    assertProviderAdminAuthority(identity);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ProviderAdminError('VALIDATION_ERROR', 'Invalid JSON.', 400);
    }
    const command = validateProviderAdminCommand(body);
    const correlationId = crypto.randomUUID();

    const url = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceRoleKey) throw new ProviderAdminError('INTERNAL_ERROR', 'Provider workflow unavailable.', 500);

    const trustedClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await trustedClient.rpc('nmis_provider_admin_write', {
      p_command: command.command,
      p_provider_id: command.providerId,
      p_payload: command.payload,
      p_actor_id: identity.userId,
      p_actor_email: identity.email,
      p_correlation_id: correlationId,
    });
    if (error) throw mapDatabaseError(error);

    const result = data as ProviderAdminRpcResponse | null;
    if (command.command === 'delete_provider') {
      return response(request, 200, { data: { success: true, correlationId } });
    }
    if (!result?.provider) throw new ProviderAdminError('INTERNAL_ERROR', 'Provider workflow returned no provider.', 500);
    return response(request, 200, { data: { provider: result.provider, correlationId } });
  } catch (error) {
    if (error instanceof ProviderAdminError) return trustedFailure(request, error.code, error.status);
    return trustedFailure(request, 'INTERNAL_ERROR', 500);
  }
});
