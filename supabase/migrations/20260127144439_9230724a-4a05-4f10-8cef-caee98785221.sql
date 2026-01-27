-- Campos para controle de parcerias
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_partner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partner_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partner_notes TEXT,
  ADD COLUMN IF NOT EXISTS partner_renewed_count INTEGER DEFAULT 0;

-- Índice para consultas de parceiros
CREATE INDEX IF NOT EXISTS idx_companies_partner 
  ON public.companies (is_partner, partner_ends_at);