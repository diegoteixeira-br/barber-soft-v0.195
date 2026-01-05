import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { useMarketingSettings } from "@/hooks/useMarketingSettings";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useAppointmentNotification() {
  const { currentUnitId } = useCurrentUnit();
  const { settings } = useMarketingSettings();
  const processedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUnitId) return;

    const channel = supabase
      .channel('appointment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `unit_id=eq.${currentUnitId}`,
        },
        async (payload) => {
          const newAppointment = payload.new as {
            id: string;
            client_name: string;
            barber_id: string | null;
            service_id: string | null;
            start_time: string;
          };

          // Avoid duplicate notifications
          if (processedIdsRef.current.has(newAppointment.id)) return;
          processedIdsRef.current.add(newAppointment.id);

          // Check if vocal notification is enabled
          if (!settings?.vocal_notification_enabled) return;

          // Fetch barber and service details
          let barberName = "um profissional";
          let serviceName = "um serviço";

          if (newAppointment.barber_id) {
            const { data: barber } = await supabase
              .from("barbers")
              .select("name")
              .eq("id", newAppointment.barber_id)
              .single();
            if (barber) barberName = barber.name;
          }

          if (newAppointment.service_id) {
            const { data: service } = await supabase
              .from("services")
              .select("name")
              .eq("id", newAppointment.service_id)
              .single();
            if (service) serviceName = service.name;
          }

          // Build notification message
          const date = new Date(newAppointment.start_time);
          const isToday = isSameDay(date, new Date());
          const dateText = isToday 
            ? "hoje" 
            : format(date, "d 'de' MMMM", { locale: ptBR });
          const timeText = format(date, "HH 'e' mm", { locale: ptBR });

          const message = `${newAppointment.client_name} agendou com ${barberName} o serviço ${serviceName} para ${dateText} às ${timeText}`;

          // Speak using Web Speech API
          speak(message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUnitId, settings?.vocal_notification_enabled]);
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.0;
  utterance.volume = 0.8;

  // Try to select a Portuguese voice
  const voices = speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.includes('pt-BR')) 
    || voices.find(v => v.lang.includes('pt'));
  if (ptVoice) utterance.voice = ptVoice;

  speechSynthesis.speak(utterance);
}
