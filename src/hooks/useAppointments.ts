import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export interface Appointment {
  id: string;
  unit_id: string;
  company_id: string | null;
  barber_id: string | null;
  service_id: string | null;
  client_name: string;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  total_price: number;
  notes: string | null;
  created_at: string;
  barber?: {
    id: string;
    name: string;
    calendar_color: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  } | null;
}

export interface AppointmentFormData {
  client_name: string;
  client_phone?: string;
  barber_id: string;
  service_id: string;
  start_time: Date;
  notes?: string;
}

export function useAppointments(startDate?: Date, endDate?: Date, barberId?: string | null) {
  const { currentUnitId, currentCompanyId } = useCurrentUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["appointments", currentUnitId, startDate?.toISOString(), endDate?.toISOString(), barberId],
    queryFn: async () => {
      if (!currentUnitId) return [];

      let queryBuilder = supabase
        .from("appointments")
        .select(`
          *,
          barber:barbers(id, name, calendar_color),
          service:services(id, name, duration_minutes, price)
        `)
        .eq("unit_id", currentUnitId)
        .order("start_time", { ascending: true });

      if (startDate) {
        queryBuilder = queryBuilder.gte("start_time", startDate.toISOString());
      }
      if (endDate) {
        queryBuilder = queryBuilder.lte("start_time", endDate.toISOString());
      }
      if (barberId) {
        queryBuilder = queryBuilder.eq("barber_id", barberId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!currentUnitId,
  });

  const createAppointment = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!currentUnitId) throw new Error("Nenhuma unidade selecionada");

      // Get service to calculate end time and price
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("duration_minutes, price")
        .eq("id", data.service_id)
        .single();

      if (serviceError) throw serviceError;

      const startTime = new Date(data.start_time);
      const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert({
          unit_id: currentUnitId,
          company_id: currentCompanyId,
          barber_id: data.barber_id,
          service_id: data.service_id,
          client_name: data.client_name,
          client_phone: data.client_phone || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_price: service.price,
          notes: data.notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento criado com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar agendamento", description: error.message, variant: "destructive" });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AppointmentFormData> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.client_name) updateData.client_name = data.client_name;
      if (data.client_phone !== undefined) updateData.client_phone = data.client_phone || null;
      if (data.barber_id) updateData.barber_id = data.barber_id;
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      
      if (data.service_id) {
        updateData.service_id = data.service_id;
        
        // Recalculate end time if service or start_time changed
        const { data: service } = await supabase
          .from("services")
          .select("duration_minutes, price")
          .eq("id", data.service_id)
          .single();

        if (service) {
          updateData.total_price = service.price;
          
          if (data.start_time) {
            const startTime = new Date(data.start_time);
            const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
            updateData.start_time = startTime.toISOString();
            updateData.end_time = endTime.toISOString();
          }
        }
      } else if (data.start_time) {
        // Get current appointment to get service duration
        const { data: currentAppointment } = await supabase
          .from("appointments")
          .select("service_id")
          .eq("id", id)
          .single();

        if (currentAppointment?.service_id) {
          const { data: service } = await supabase
            .from("services")
            .select("duration_minutes")
            .eq("id", currentAppointment.service_id)
            .single();

          if (service) {
            const startTime = new Date(data.start_time);
            const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);
            updateData.start_time = startTime.toISOString();
            updateData.end_time = endTime.toISOString();
          }
        }
      }

      const { data: appointment, error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento atualizado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Status atualizado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento excluído!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createAppointment,
    updateAppointment,
    updateStatus,
    deleteAppointment,
  };
}
