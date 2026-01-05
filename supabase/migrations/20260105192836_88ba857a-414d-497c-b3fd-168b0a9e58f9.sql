-- Add source column to track where the appointment came from
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Add a comment for documentation
COMMENT ON COLUMN public.appointments.source IS 'Origin of the appointment: manual, whatsapp, api';