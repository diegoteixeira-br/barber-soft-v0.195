-- 1. Criar tabela companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  evolution_instance_name text,
  evolution_api_key text,
  owner_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. Criar função helper para RLS
CREATE OR REPLACE FUNCTION public.user_owns_company(p_company_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND owner_user_id = auth.uid()
  )
$$;

-- 4. Políticas RLS para companies
CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- 5. Trigger para updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_settings_updated_at();

-- 6. Adicionar company_id nas tabelas existentes (nullable primeiro)
ALTER TABLE public.units ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.barbers ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.services ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.appointments ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- 7. Migrar dados existentes - criar empresas para usuários com unidades
INSERT INTO public.companies (owner_user_id, name)
SELECT DISTINCT user_id, 'Minha Empresa'
FROM public.units
WHERE user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 8. Vincular unidades às empresas
UPDATE public.units u
SET company_id = c.id
FROM public.companies c
WHERE u.user_id = c.owner_user_id AND u.company_id IS NULL;

-- 9. Vincular barbers através das units
UPDATE public.barbers b
SET company_id = u.company_id
FROM public.units u
WHERE b.unit_id = u.id AND b.company_id IS NULL;

-- 10. Vincular services através das units
UPDATE public.services s
SET company_id = u.company_id
FROM public.units u
WHERE s.unit_id = u.id AND s.company_id IS NULL;

-- 11. Vincular appointments através das units
UPDATE public.appointments a
SET company_id = u.company_id
FROM public.units u
WHERE a.unit_id = u.id AND a.company_id IS NULL;