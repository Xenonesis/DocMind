ALTER TABLE public.ai_provider_settings
ADD COLUMN IF NOT EXISTS cost_per_1k_tokens NUMERIC(10,6);

COMMENT ON COLUMN public.ai_provider_settings.cost_per_1k_tokens
IS 'Optional per-model pricing override in USD per 1K total tokens.';