// PENDING LIVE VERIFICATION — do not deploy before approved staging preflight.
// This function intentionally performs no Auth Admin operation. It exists only
// as the reviewed boundary for future audited invitation, role-change and
// deactivation operations. It must never create a replacement administrator.
import { secureJson } from '../_shared/security.ts';

Deno.serve(() => secureJson({
  error: 'Trusted user administration is pending Phase 3B live verification.',
}, 503));
