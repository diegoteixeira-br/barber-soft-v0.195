
# Plano: Corrigir Programa de Fidelidade no Trigger

## Problema Identificado

O trigger `sync_client_on_appointment_complete` está:
- ✅ Atualizando `total_visits` (passou de 0 para 2)
- ✅ Atualizando `last_visit_at` 
- ❌ **NÃO incrementando `loyalty_cuts`** (permanece 0)

### Causa Raiz

No fluxo atual do trigger, quando o cliente **já existe** (não é criado pelo trigger), a variável `client_record` contém os dados do SELECT inicial. O UPDATE subsequente de `total_visits` não retorna para `client_record`, então quando o código verifica `IF client_record IS NOT NULL`, ele usa o registro correto.

**Porém**, a lógica de fidelidade só estava sendo aplicada quando o cliente era **criado pelo trigger** (`RETURNING * INTO client_record`). Para clientes já existentes, o `client_record` continha dados mas o fluxo de fidelidade não estava sendo executado corretamente.

## Solução

Modificar o trigger `sync_client_on_appointment_complete` para garantir que a lógica de fidelidade seja executada **sempre** que um cliente existente recebe um agendamento finalizado.

### Arquivo a modificar

**Criar nova migração SQL** para corrigir a função do trigger:

```sql
CREATE OR REPLACE FUNCTION public.sync_client_on_appointment_complete()
RETURNS TRIGGER AS $$
DECLARE
  client_record RECORD;
  fidelity_enabled boolean;
  cuts_threshold integer;
  min_value numeric;
  owner_id uuid;
  should_count_loyalty boolean;
  is_new_status_completed boolean;
  current_loyalty_cuts integer;
BEGIN
  -- Determine if this is a new completion
  IF TG_OP = 'INSERT' THEN
    is_new_status_completed := (NEW.status = 'completed');
  ELSE
    is_new_status_completed := (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed');
  END IF;

  IF is_new_status_completed AND NEW.client_phone IS NOT NULL AND NEW.client_phone != '' THEN
    
    -- Check if client already exists
    SELECT * INTO client_record 
    FROM public.clients 
    WHERE unit_id = NEW.unit_id AND phone = NEW.client_phone;
    
    IF client_record IS NULL THEN
      -- Create new client (only if NOT dependent)
      IF NEW.is_dependent IS NOT TRUE THEN
        INSERT INTO public.clients (company_id, unit_id, name, phone, birth_date, last_visit_at, total_visits, loyalty_cuts)
        VALUES (NEW.company_id, NEW.unit_id, NEW.client_name, NEW.client_phone, NEW.client_birth_date, NOW(), 1, 0)
        RETURNING * INTO client_record;
      END IF;
    ELSE
      -- Client exists: update visit stats
      UPDATE public.clients
      SET last_visit_at = NOW(), total_visits = COALESCE(total_visits, 0) + 1, updated_at = NOW()
      WHERE id = client_record.id;
    END IF;
    
    -- Handle fidelity program (for both new and existing clients)
    IF client_record IS NOT NULL THEN
      -- Get owner and settings
      SELECT owner_user_id INTO owner_id FROM public.companies WHERE id = NEW.company_id;
      
      SELECT COALESCE(bs.fidelity_program_enabled, false), 
             COALESCE(bs.fidelity_cuts_threshold, 10),
             COALESCE(bs.fidelity_min_value, 30.00)
      INTO fidelity_enabled, cuts_threshold, min_value
      FROM public.business_settings bs WHERE bs.user_id = owner_id;
      
      -- Check if should count for loyalty
      should_count_loyalty := (
        fidelity_enabled = true 
        AND cuts_threshold > 0
        AND NEW.total_price >= min_value
        AND (NEW.payment_method IS NULL OR NEW.payment_method NOT IN ('courtesy', 'fidelity_courtesy'))
      );
      
      IF should_count_loyalty THEN
        -- Get CURRENT loyalty_cuts from database (fresh read)
        SELECT loyalty_cuts INTO current_loyalty_cuts 
        FROM public.clients WHERE id = client_record.id;
        
        current_loyalty_cuts := COALESCE(current_loyalty_cuts, 0);
        
        -- Check if will complete cycle
        IF (current_loyalty_cuts + 1) >= cuts_threshold THEN
          -- Credit courtesy and reset counter
          UPDATE public.clients
          SET loyalty_cuts = 0, 
              available_courtesies = COALESCE(available_courtesies, 0) + 1,
              total_courtesies_earned = COALESCE(total_courtesies_earned, 0) + 1,
              updated_at = NOW()
          WHERE id = client_record.id;
        ELSE
          -- Increment loyalty cuts
          UPDATE public.clients
          SET loyalty_cuts = current_loyalty_cuts + 1, updated_at = NOW()
          WHERE id = client_record.id;
        END IF;
      END IF;
    END IF;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Resumo das Correções

| Problema | Correção |
|----------|----------|
| Variável `updated_client_record` não era consistente | Usar SELECT direto para `current_loyalty_cuts` |
| Fluxo confuso com múltiplos RECORDs | Simplificar para uma única variável `client_record` |
| Lógica de fidelidade não executava para clientes existentes | Garantir que o bloco de fidelidade sempre execute quando `client_record IS NOT NULL` |

## Resultado Esperado

Após a correção:
- Agendamentos finalizados com valor ≥ R$ 30 incrementarão `loyalty_cuts`
- Ao atingir 5 cortes, o cliente receberá 1 cortesia automática
- O contador reinicia do zero após ganhar a cortesia
