import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MarketingSettings {
  birthday_automation_enabled: boolean;
  birthday_message_template: string;
  rescue_automation_enabled: boolean;
  rescue_days_threshold: number;
  rescue_message_template: string;
  automation_send_hour: number;
  automation_send_minute: number;
  appointment_reminder_enabled: boolean;
  appointment_reminder_minutes: number;
  appointment_reminder_template: string;
  vocal_notification_enabled: boolean;
}

export function useMarketingSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["marketing-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("business_settings")
        .select("birthday_automation_enabled, birthday_message_template, rescue_automation_enabled, rescue_days_threshold, rescue_message_template, automation_send_hour, automation_send_minute, appointment_reminder_enabled, appointment_reminder_minutes, appointment_reminder_template, vocal_notification_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      return data as MarketingSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: Partial<MarketingSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("business_settings")
        .update(settings)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-settings"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings,
  };
}