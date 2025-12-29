import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  company_id: string | null;
  unit_id: string;
  name: string;
  phone: string;
  birth_date: string | null;
  notes: string | null;
  last_visit_at: string | null;
  total_visits: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  unit_name?: string;
}

export type CreateClientData = {
  name: string;
  phone: string;
  birth_date?: string | null;
  notes?: string | null;
  tags?: string[];
  unit_id?: string;
};

export type ClientFilter = "all" | "birthday_month" | "inactive";

interface UseClientsOptions {
  filter?: ClientFilter;
  unitIdFilter?: string | null; // null = all units, string = specific unit
}

export function useClients(filterOrOptions: ClientFilter | UseClientsOptions = "all") {
  const { currentUnitId } = useCurrentUnit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle both old signature (just filter) and new signature (options object)
  const options: UseClientsOptions = typeof filterOrOptions === "string" 
    ? { filter: filterOrOptions, unitIdFilter: undefined }
    : filterOrOptions;
  
  const filter = options.filter || "all";
  const unitIdFilter = options.unitIdFilter !== undefined ? options.unitIdFilter : currentUnitId;

  const query = useQuery({
    queryKey: ["clients", unitIdFilter, filter],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*, units!inner(name)")
        .order("name", { ascending: true });

      // Filter by unit
      if (unitIdFilter) {
        query = query.eq("unit_id", unitIdFilter);
      } else {
        // Get all units owned by the user first
        const { data: userUnits } = await supabase
          .from("units")
          .select("id");
        
        if (!userUnits || userUnits.length === 0) return [];
        
        const unitIds = userUnits.map(u => u.id);
        query = query.in("unit_id", unitIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      let clients = (data || []).map((item: any) => ({
        ...item,
        unit_name: item.units?.name || "Unidade desconhecida",
        units: undefined,
      })) as Client[];

      // Apply filters
      if (filter === "birthday_month") {
        const currentMonth = new Date().getMonth() + 1;
        clients = clients.filter((client) => {
          if (!client.birth_date) return false;
          const birthMonth = Number(client.birth_date.split("-")[1]);
          return birthMonth === currentMonth;
        });
      } else if (filter === "inactive") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        clients = clients.filter((client) => {
          if (!client.last_visit_at) return true;
          return new Date(client.last_visit_at) < thirtyDaysAgo;
        });
      }

      return clients;
    },
    enabled: unitIdFilter !== undefined || unitIdFilter === null,
  });

  const createClient = useMutation({
    mutationFn: async (data: CreateClientData) => {
      const targetUnitId = data.unit_id || currentUnitId;
      if (!targetUnitId) throw new Error("Unidade não selecionada");

      const { data: unit } = await supabase
        .from("units")
        .select("company_id")
        .eq("id", targetUnitId)
        .single();

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert({
          unit_id: targetUnitId,
          company_id: unit?.company_id,
          name: data.name,
          phone: data.phone,
          birth_date: data.birth_date || null,
          notes: data.notes || null,
          tags: data.tags || [],
          total_visits: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return newClient as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente cadastrado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const { error } = await supabase
        .from("clients")
        .update({
          name: data.name,
          phone: data.phone,
          birth_date: data.birth_date,
          notes: data.notes,
          tags: data.tags,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente removido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    createClient,
    updateClient,
    deleteClient,
  };
}
