-- Add unique constraint on provider_name to ensure authoritative reconciliation
ALTER TABLE public.providers ADD CONSTRAINT providers_provider_name_key UNIQUE (provider_name);
