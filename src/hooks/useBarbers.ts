import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Barber {
  id: string;
  unit_id: string;
  company_id: string | null;
  name: string;
  photo_url: string | null;
  phone: string | null;
  calendar_color: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export type BarberFormData = Omit<Barber, "id" | "created_at" | "company_id">;

export function useBarbers(unitId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: barbers = [], isLoading, refetch } = useQuery({
    queryKey: ["barbers", unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("unit_id", unitId)
        .order("name");

      if (error) throw error;
      return data as Barber[];
    },
    enabled: !!unitId,
  });

  const createBarber = useMutation({
    mutationFn: async (barber: Omit<BarberFormData, "unit_id">) => {
      if (!unitId) throw new Error("Nenhuma unidade selecionada");

      // Get company_id from the unit
      const { data: unit } = await supabase
        .from("units")
        .select("company_id")
        .eq("id", unitId)
        .single();

      const { data, error } = await supabase
        .from("barbers")
        .insert({ 
          ...barber, 
          unit_id: unitId,
          company_id: unit?.company_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers", unitId] });
      toast({ title: "Profissional adicionado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar profissional", description: error.message, variant: "destructive" });
    },
  });

  const updateBarber = useMutation({
    mutationFn: async ({ id, ...barber }: Partial<Barber> & { id: string }) => {
      const { data, error } = await supabase
        .from("barbers")
        .update(barber)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers", unitId] });
      toast({ title: "Profissional atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar profissional", description: error.message, variant: "destructive" });
    },
  });

  const deleteBarber = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers", unitId] });
      toast({ title: "Profissional removido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover profissional", description: error.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("barbers")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["barbers", unitId] });
      toast({ title: data.is_active ? "Profissional ativado!" : "Profissional desativado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
    },
  });

  return { 
    barbers, 
    isLoading, 
    refetch,
    createBarber, 
    updateBarber, 
    deleteBarber,
    toggleActive
  };
}
