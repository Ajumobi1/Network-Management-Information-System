export default function SecurityPolicyPage() {
  return (
    <main className="min-h-screen bg-brand-background px-6 py-16 text-brand-foreground">
      <div className="mx-auto max-w-3xl rounded-3xl border border-brand-divider bg-brand-card p-8 shadow-soft sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-blue">ODCHC NMIS</p>
        <h1 className="mt-3 text-3xl font-bold">Security Policy</h1>
        <p className="mt-4 text-sm leading-7 text-brand-muted">
          ODCHC NMIS welcomes responsible disclosure of security vulnerabilities. Please report suspected security issues privately so they can be assessed and remediated without exposing users or operational data.
        </p>
        <h2 className="mt-8 text-lg font-semibold">Reporting a vulnerability</h2>
        <p className="mt-3 text-sm leading-7 text-brand-muted">
          Email <a className="font-semibold text-brand-blue underline" href="mailto:security@odchcnmis.online">security@odchcnmis.online</a> with the affected URL or component, a concise description, reproduction steps, and any relevant evidence. Do not include passwords, authentication tokens, personal health information, or other unnecessary sensitive data.
        </p>
        <h2 className="mt-8 text-lg font-semibold">Responsible testing</h2>
        <p className="mt-3 text-sm leading-7 text-brand-muted">
          Do not attempt denial-of-service testing, destructive actions, credential attacks against real users, bulk data extraction, or access to records that do not belong to you. Use authorized test accounts and synthetic data for authenticated security testing.
        </p>
        <p className="mt-8 text-xs text-brand-muted">Security contact: security@odchcnmis.online</p>
      </div>
    </main>
  );
}
