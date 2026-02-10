-- Rate Limiting Table for Edge Functions
-- Run this migration to enable rate limiting

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    requests BIGINT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);

-- Create index on updated_at for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated ON public.rate_limits(updated_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY rate_limits_service_role_only
ON public.rate_limits
FOR ALL
USING (auth.role() = 'service_role');

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_rate_limits_modtime ON public.rate_limits;
CREATE TRIGGER update_rate_limits_modtime
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE updated_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Optional: Create a cron job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '*/15 * * * *', 'SELECT cleanup_rate_limits()');

COMMENT ON TABLE public.rate_limits IS 'Rate limiting data for Edge Functions';
COMMENT ON COLUMN public.rate_limits.key IS 'Unique identifier for rate limit (user:id or ip:address)';
COMMENT ON COLUMN public.rate_limits.requests IS 'Array of request timestamps in milliseconds';
