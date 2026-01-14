import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string | null;
  logo_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  webhook_url: string | null;
  cancellation_time_limit_minutes: number | null;
  late_cancellation_fee_percent: number | null;
  no_show_fee_percent: number | null;
  debit_card_fee_percent: number | null;
  credit_card_fee_percent: number | null;
  commission_calculation_base: 'gross' | 'net' | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettingsInput {
  business_name?: string | null;
  logo_url?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  webhook_url?: string | null;
  cancellation_time_limit_minutes?: number | null;
  late_cancellation_fee_percent?: number | null;
  no_show_fee_percent?: number | null;
  debit_card_fee_percent?: number | null;
  credit_card_fee_percent?: number | null;
  commission_calculation_base?: 'gross' | 'net' | null;
}

export function useBusinessSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BusinessSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (input: BusinessSettingsInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: existing } = await supabase
        .from("business_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("business_settings")
          .update(input)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("business_settings")
          .insert({ ...input, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadLogo = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Erro no upload",
        description: uploadError.message,
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const testWebhook = async (url: string): Promise<{ success: boolean; message: string }> => {
    try {
      new URL(url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test",
          message: "Teste de conexão do Sistema de Barbearia",
          timestamp: new Date().toISOString(),
        }),
        mode: "no-cors",
      });

      return { 
        success: true, 
        message: "Requisição enviada! Verifique se o webhook recebeu a mensagem." 
      };
    } catch (error) {
      return { 
        success: false, 
        message: "URL inválida ou não acessível" 
      };
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    uploadLogo,
    testWebhook,
  };
}
