-- Add vocal notification setting
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS vocal_notification_enabled boolean DEFAULT true;