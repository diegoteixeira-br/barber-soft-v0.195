import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API Key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('BARBERSOFT_API_KEY');
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, instance_name } = body;

    console.log('Agenda API called with action:', action);
    console.log('Request body:', JSON.stringify(body));

    // Se instance_name for fornecido, buscar a unidade diretamente por ele
    let resolvedUnitId = body.unit_id;
    let companyId = null;
    
    if (instance_name && !resolvedUnitId) {
      console.log(`Looking up unit by instance_name: ${instance_name}`);
      
      // Busca direto na tabela units pelo evolution_instance_name
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id, company_id')
        .eq('evolution_instance_name', instance_name)
        .maybeSingle();
      
      if (unitError) {
        console.error('Error looking up unit:', unitError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao buscar unidade' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!unit) {
        console.error(`Unit not found for instance: ${instance_name}`);
        return new Response(
          JSON.stringify({ success: false, error: `Unidade não encontrada para a instância "${instance_name}"` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      resolvedUnitId = unit.id;
      companyId = unit.company_id;
      console.log(`Resolved unit_id: ${resolvedUnitId}, company_id: ${companyId}`);
    }

    // Passar o unit_id resolvido para os handlers
    const enrichedBody = { ...body, unit_id: resolvedUnitId, company_id: companyId };

    switch (action) {
      case 'check':
        return await handleCheck(supabase, enrichedBody, corsHeaders);
      case 'create':
        return await handleCreate(supabase, enrichedBody, corsHeaders);
      case 'cancel':
        return await handleCancel(supabase, enrichedBody, corsHeaders);
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Error in agenda-api:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handler para consultar disponibilidade
async function handleCheck(supabase: any, body: any, corsHeaders: any) {
  const { date, professional, unit_id } = body;

  if (!date) {
    return new Response(
      JSON.stringify({ success: false, error: 'Data é obrigatória' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Checking availability for date: ${date}, professional: ${professional || 'any'}, unit: ${unit_id}`);

  // Buscar barbeiros ativos da unidade
  let barbersQuery = supabase
    .from('barbers')
    .select('id, name, calendar_color')
    .eq('unit_id', unit_id)
    .eq('is_active', true);

  if (professional && professional.trim() !== '') {
    barbersQuery = barbersQuery.ilike('name', `%${professional}%`);
  }

  const { data: barbers, error: barbersError } = await barbersQuery;

  if (barbersError) {
    console.error('Error fetching barbers:', barbersError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao buscar barbeiros' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!barbers || barbers.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        date,
        available_slots: [],
        message: professional ? `Nenhum barbeiro encontrado com o nome "${professional}"` : 'Nenhum barbeiro ativo encontrado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Found ${barbers.length} barbers`);

  // Buscar serviços ativos da unidade
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('unit_id', unit_id)
    .eq('is_active', true);

  if (servicesError) {
    console.error('Error fetching services:', servicesError);
  }

  // Buscar agendamentos do dia (exceto cancelados)
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('id, barber_id, start_time, end_time, status')
    .eq('unit_id', unit_id)
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('status', 'cancelled');

  if (appointmentsError) {
    console.error('Error fetching appointments:', appointmentsError);
  }

  console.log(`Found ${appointments?.length || 0} existing appointments`);

  // Gerar slots disponíveis (08:00 às 21:00, intervalos de 30 min)
  const availableSlots: any[] = [];
  const openingHour = 8;
  const closingHour = 21;

  for (let hour = openingHour; hour < closingHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const slotStart = new Date(`${date}T${timeStr}:00`);

      for (const barber of barbers) {
        // Verificar se o barbeiro está ocupado neste horário
        const isOccupied = appointments?.some((apt: any) => {
          if (apt.barber_id !== barber.id) return false;
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return slotStart >= aptStart && slotStart < aptEnd;
        });

        if (!isOccupied) {
          availableSlots.push({
            time: timeStr,
            datetime: slotStart.toISOString(),
            barber_id: barber.id,
            barber_name: barber.name
          });
        }
      }
    }
  }

  console.log(`Generated ${availableSlots.length} available slots`);

  return new Response(
    JSON.stringify({
      success: true,
      date,
      available_slots: availableSlots,
      services: services || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para criar agendamento
async function handleCreate(supabase: any, body: any, corsHeaders: any) {
  // Normalizar campos (aceitar ambos formatos)
  const clientName = body.nome || body.client_name;
  const rawPhone = body.telefone || body.client_phone;
  // Normalizar telefone - remover caracteres especiais para consistência
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const dateTime = body.data || body.datetime;
  const barberName = body.barbeiro_nome || body.professional;
  const serviceName = body.servico || body.service;
  const { unit_id, company_id } = body;

  // Validações
  if (!clientName || !barberName || !serviceName || !dateTime || !unit_id) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Campos obrigatórios: nome/client_name, barbeiro_nome/professional, servico/service, data/datetime' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Creating appointment: ${clientName} with ${barberName} for ${serviceName} at ${dateTime}`);
  console.log(`Normalized phone: ${clientPhone}`);

  // === VERIFICAR/CRIAR CLIENTE ===
  let clientCreated = false;
  let clientData = null;

  if (clientPhone) {
    // Buscar cliente existente pelo telefone normalizado
    const { data: existingClient, error: clientFetchError } = await supabase
      .from('clients')
      .select('id, name, phone, total_visits')
      .eq('unit_id', unit_id)
      .eq('phone', clientPhone)
      .maybeSingle();

    if (clientFetchError) {
      console.error('Error fetching client:', clientFetchError);
    }

    if (existingClient) {
      console.log('Cliente existente encontrado:', existingClient);
      clientData = existingClient;
    } else {
      // Criar novo cliente - BLOQUEAR se falhar
      console.log(`Criando novo cliente: ${clientName} - ${clientPhone}`);
      const { data: newClient, error: clientCreateError } = await supabase
        .from('clients')
        .insert({
          unit_id,
          company_id: company_id || null,
          name: clientName,
          phone: clientPhone,
          total_visits: 0
        })
        .select()
        .single();

      if (clientCreateError) {
        console.error('ERRO ao criar cliente:', clientCreateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erro ao criar cliente: ${clientCreateError.message}` 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Novo cliente criado com sucesso:', newClient);
      clientData = newClient;
      clientCreated = true;
    }
  }

  // Buscar o barbeiro pelo nome
  const { data: barbers, error: barberError } = await supabase
    .from('barbers')
    .select('id, name, company_id')
    .eq('unit_id', unit_id)
    .eq('is_active', true)
    .ilike('name', `%${barberName}%`)
    .limit(1);

  if (barberError || !barbers || barbers.length === 0) {
    console.error('Barber not found:', barberError);
    return new Response(
      JSON.stringify({ success: false, error: `Barbeiro "${barberName}" não encontrado` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const barber = barbers[0];
  console.log('Found barber:', barber);

  // Buscar o serviço pelo nome
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('unit_id', unit_id)
    .eq('is_active', true)
    .ilike('name', `%${serviceName}%`)
    .limit(1);

  if (serviceError || !services || services.length === 0) {
    console.error('Service not found:', serviceError);
    return new Response(
      JSON.stringify({ success: false, error: `Serviço "${serviceName}" não encontrado` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const selectedService = services[0];
  console.log('Found service:', selectedService);

  // Calcular end_time
  const startTime = new Date(dateTime);
  const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);

  // Verificar se o horário está disponível
  const { data: conflictingApts, error: conflictError } = await supabase
    .from('appointments')
    .select('id')
    .eq('unit_id', unit_id)
    .eq('barber_id', barber.id)
    .neq('status', 'cancelled')
    .lt('start_time', endTime.toISOString())
    .gt('end_time', startTime.toISOString());

  if (conflictError) {
    console.error('Error checking conflicts:', conflictError);
  }

  if (conflictingApts && conflictingApts.length > 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Horário não disponível. ${barber.name} já tem agendamento neste horário.` 
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Criar o agendamento
  const { data: appointment, error: createError } = await supabase
    .from('appointments')
    .insert({
      unit_id,
      company_id: company_id || barber.company_id,
      barber_id: barber.id,
      service_id: selectedService.id,
      client_name: clientName,
      client_phone: clientPhone || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_price: selectedService.price,
      status: 'pending'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating appointment:', createError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao criar agendamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Appointment created:', appointment);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Agendamento criado com sucesso!',
      client_created: clientCreated,
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        phone: clientData.phone,
        is_new: clientCreated
      } : null,
      appointment: {
        id: appointment.id,
        client_name: appointment.client_name,
        barber: barber.name,
        service: selectedService.name,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        total_price: appointment.total_price,
        status: appointment.status
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handler para cancelar agendamento
async function handleCancel(supabase: any, body: any, corsHeaders: any) {
  // Normalizar campos
  const appointmentId = body.appointment_id;
  const rawPhone = body.telefone || body.client_phone;
  // Normalizar telefone - remover caracteres especiais para consistência
  const clientPhone = rawPhone?.replace(/\D/g, '') || null;
  const targetDate = body.data || body.datetime;
  const { unit_id } = body;

  if (!unit_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'unit_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!appointmentId && !clientPhone) {
    return new Response(
      JSON.stringify({ success: false, error: 'Informe appointment_id ou telefone/client_phone' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Cancelling appointment: id=${appointmentId}, phone=${clientPhone}, date=${targetDate}, unit=${unit_id}`);

  // Se temos appointment_id, cancelar diretamente
  if (appointmentId) {
    const { data: cancelled, error: cancelError } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .eq('unit_id', unit_id)
      .in('status', ['pending', 'confirmed'])
      .select();

    if (cancelError) {
      console.error('Error cancelling appointment:', cancelError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao cancelar agendamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cancelled || cancelled.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Agendamento não encontrado ou já cancelado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Appointment cancelled by ID:', cancelled[0]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agendamento cancelado com sucesso!',
        cancelled_appointment: cancelled[0]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Se temos telefone, buscar agendamento
  let query = supabase
    .from('appointments')
    .select('id, client_name, start_time, status')
    .eq('unit_id', unit_id)
    .eq('client_phone', clientPhone)
    .in('status', ['pending', 'confirmed']);

  // Se data específica foi fornecida, filtrar por ela
  if (targetDate) {
    const dateOnly = targetDate.split('T')[0]; // Pegar apenas YYYY-MM-DD
    const startOfDay = `${dateOnly}T00:00:00`;
    const endOfDay = `${dateOnly}T23:59:59`;
    query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    console.log(`Filtering by date range: ${startOfDay} to ${endOfDay}`);
  } else {
    // Comportamento original: próximo agendamento futuro
    query = query.gte('start_time', new Date().toISOString());
  }

  query = query.order('start_time', { ascending: true }).limit(1);

  const { data: foundAppointment, error: findError } = await query;

  if (findError || !foundAppointment || foundAppointment.length === 0) {
    const dateMsg = targetDate ? ` na data ${targetDate}` : ' futuro';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Nenhum agendamento${dateMsg} encontrado para este telefone` 
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Found appointment to cancel:', foundAppointment[0]);

  // Cancelar o agendamento encontrado
  const { data: cancelled, error: cancelError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', foundAppointment[0].id)
    .select();

  if (cancelError) {
    console.error('Error cancelling appointment:', cancelError);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro ao cancelar agendamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Appointment cancelled:', cancelled[0]);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Agendamento cancelado com sucesso!',
      cancelled_appointment: cancelled[0]
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
