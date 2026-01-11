-- Remove the insecure public RLS policy that exposes barber PII
DROP POLICY IF EXISTS "Allow public to read barber by invite token" ON public.barbers;