import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Service {
  id: string;
  unit_id: string;
  company_id: string | null;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export type ServiceFormData = Omit<Service, "id" | "created_at" | "unit_id" | "company_id">;

export function useServices(unitId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ["services", unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("unit_id", unitId)
        .order("name");

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!unitId,
  });

  const createService = useMutation({
    mutationFn: async (service: ServiceFormData) => {
      if (!unitId) throw new Error("Nenhuma unidade selecionada");

      // Get company_id from the unit
      const { data: unit } = await supabase
        .from("units")
        .select("company_id")
        .eq("id", unitId)
        .single();

      const { data, error } = await supabase
        .from("services")
        .insert({ 
          ...service, 
          unit_id: unitId,
          company_id: unit?.company_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", unitId] });
      toast({ title: "Serviço adicionado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar serviço", description: error.message, variant: "destructive" });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...service }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(service)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", unitId] });
      toast({ title: "Serviço atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar serviço", description: error.message, variant: "destructive" });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", unitId] });
      toast({ title: "Serviço removido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover serviço", description: error.message, variant: "destructive" });
    },
  });

  return { 
    services, 
    isLoading, 
    refetch,
    createService, 
    updateService, 
    deleteService
  };
}
