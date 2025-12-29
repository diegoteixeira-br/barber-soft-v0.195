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
  unit_name?: string;
}

export type BarberFormData = Omit<Barber, "id" | "created_at" | "company_id" | "unit_name"> & {
  unit_id?: string;
};

export function useBarbers(unitId: string | null | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: barbers = [], isLoading, refetch } = useQuery({
    queryKey: ["barbers", unitId],
    queryFn: async () => {
      let query = supabase
        .from("barbers")
        .select("*, units!inner(name)")
        .order("name");

      if (unitId) {
        query = query.eq("unit_id", unitId);
      } else if (unitId === null) {
        // Get all units owned by the user
        const { data: userUnits } = await supabase
          .from("units")
          .select("id");
        
        if (!userUnits || userUnits.length === 0) return [];
        
        const unitIds = userUnits.map(u => u.id);
        query = query.in("unit_id", unitIds);
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        unit_name: item.units?.name || "Unidade desconhecida",
        units: undefined,
      })) as Barber[];
    },
    enabled: unitId !== undefined,
  });

  const createBarber = useMutation({
    mutationFn: async (barber: Omit<BarberFormData, "unit_id"> & { unit_id?: string }) => {
      const targetUnitId = barber.unit_id || unitId;
      if (!targetUnitId) throw new Error("Nenhuma unidade selecionada");

      // Get company_id from the unit
      const { data: unit } = await supabase
        .from("units")
        .select("company_id")
        .eq("id", targetUnitId)
        .single();

      const { data, error } = await supabase
        .from("barbers")
        .insert({ 
          name: barber.name,
          phone: barber.phone,
          photo_url: barber.photo_url,
          calendar_color: barber.calendar_color,
          commission_rate: barber.commission_rate,
          is_active: barber.is_active,
          unit_id: targetUnitId,
          company_id: unit?.company_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
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
        .update({
          name: barber.name,
          phone: barber.phone,
          photo_url: barber.photo_url,
          calendar_color: barber.calendar_color,
          commission_rate: barber.commission_rate,
          is_active: barber.is_active,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
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
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
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
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
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
