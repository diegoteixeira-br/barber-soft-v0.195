-- Add card fee configuration and commission calculation base to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS debit_card_fee_percent numeric(5,2) DEFAULT 1.50,
ADD COLUMN IF NOT EXISTS credit_card_fee_percent numeric(5,2) DEFAULT 3.00,
ADD COLUMN IF NOT EXISTS commission_calculation_base text DEFAULT 'gross';

-- Add check constraint for commission_calculation_base
ALTER TABLE public.business_settings 
ADD CONSTRAINT commission_calculation_base_check 
CHECK (commission_calculation_base IN ('gross', 'net'));