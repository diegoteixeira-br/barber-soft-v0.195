-- Add cancellation policy fields to business_settings
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS cancellation_time_limit_hours integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS late_cancellation_fee_percent integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS no_show_fee_percent integer DEFAULT 100;