// PENDING LIVE VERIFICATION — do not deploy before approved staging preflight.
// This reviewed boundary will later enforce identity, controlled role, AAL2 where
// required, source-file validation, SHA-256 provenance, batch transitions and
// immutable audit events. It intentionally performs no Storage or database work.
import { secureJson } from '../_shared/security.ts';

Deno.serve(() => secureJson({
  error: 'Secure ORANGHIS intake is pending Phase 3B live verification.',
}, 503));
