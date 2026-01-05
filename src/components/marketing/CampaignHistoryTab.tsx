import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp, AlertCircle, Building2, Users, Image as ImageIcon, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { toast } from "sonner";

interface Campaign {
  id: string;
  message_template: string;
  media_url: string | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at: string | null;
  unit_id: string | null;
}

interface MessageLog {
  id: string;
  recipient_name: string | null;
  recipient_phone: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
}

interface UnitInfo {
  id: string;
  name: string;
}

export function CampaignHistoryTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [units, setUnits] = useState<Map<string, UnitInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [campaignLogs, setCampaignLogs] = useState<Map<string, MessageLog[]>>(new Map());
  const [loadingLogs, setLoadingLogs] = useState<string | null>(null);
  const [cancelingCampaign, setCancelingCampaign] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const { currentCompanyId } = useCurrentUnit();

  // Fetch campaigns
  useEffect(() => {
    if (!currentCompanyId) return;

    const fetchCampaigns = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .eq("company_id", currentCompanyId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching campaigns:", error);
      } else {
        setCampaigns(data || []);
        
        // Fetch unit names
        const unitIds = [...new Set((data || []).map(c => c.unit_id).filter(Boolean))];
        if (unitIds.length > 0) {
          const { data: unitsData } = await supabase
            .from("units")
            .select("id, name")
            .in("id", unitIds);
          
          const unitsMap = new Map<string, UnitInfo>();
          (unitsData || []).forEach(u => unitsMap.set(u.id, u));
          setUnits(unitsMap);
        }
      }
      setIsLoading(false);
    };

    fetchCampaigns();
  }, [currentCompanyId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentCompanyId) return;

    const channel = supabase
      .channel("campaigns-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketing_campaigns",
          filter: `company_id=eq.${currentCompanyId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setCampaigns((prev) => [payload.new as Campaign, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setCampaigns((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Campaign) : c))
            );
          } else if (payload.eventType === "DELETE") {
            setCampaigns((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCompanyId]);

  // Fetch logs for expanded campaign
  const fetchLogs = async (campaignId: string) => {
    if (campaignLogs.has(campaignId)) return;
    
    setLoadingLogs(campaignId);
    const { data, error } = await supabase
      .from("campaign_message_logs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sent_at", { ascending: false });

    if (!error && data) {
      setCampaignLogs((prev) => new Map(prev).set(campaignId, data));
    }
    setLoadingLogs(null);
  };

  const toggleExpand = (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
      fetchLogs(campaignId);
    }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    setCancelingCampaign(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-campaign", {
        body: { campaign_id: campaignId },
      });

      if (error) {
        console.error("Error canceling campaign:", error);
        toast.error("Erro ao cancelar campanha");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Campanha cancelada com sucesso");
      // Refresh logs if expanded
      if (expandedCampaign === campaignId) {
        setCampaignLogs((prev) => {
          const newMap = new Map(prev);
          newMap.delete(campaignId);
          return newMap;
        });
        fetchLogs(campaignId);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado ao cancelar campanha");
    } finally {
      setCancelingCampaign(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Concluída</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-600 text-white"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Em andamento</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Falhou</Badge>;
      case "canceled":
        return <Badge variant="outline" className="border-amber-500 text-amber-600"><Ban className="mr-1 h-3 w-3" />Cancelada</Badge>;
      default:
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "skipped":
        return <Ban className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getProgress = (campaign: Campaign) => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-muted-foreground opacity-30" />
          <p className="mt-4 text-muted-foreground">Nenhuma campanha enviada ainda</p>
          <p className="text-sm text-muted-foreground">As campanhas enviadas aparecerão aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{campaigns.length} campanha(s) encontrada(s)</p>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const progress = getProgress(campaign);
            const unit = campaign.unit_id ? units.get(campaign.unit_id) : null;
            const logs = campaignLogs.get(campaign.id) || [];
            const isExpanded = expandedCampaign === campaign.id;

            return (
              <Collapsible key={campaign.id} open={isExpanded} onOpenChange={() => toggleExpand(campaign.id)}>
                <Card className={campaign.status === "processing" ? "border-blue-500/50 bg-blue-500/5" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(campaign.status)}
                          {unit && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="mr-1 h-3 w-3" />
                              {unit.name}
                            </Badge>
                          )}
                          {campaign.media_url && (
                            <Badge variant="outline" className="text-xs">
                              <ImageIcon className="mr-1 h-3 w-3" />
                              Com imagem
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-2">
                          {format(new Date(campaign.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{campaign.total_recipients}</span>
                          </div>
                        </div>
                        {(campaign.status === "processing" || campaign.status === "pending") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-500 hover:bg-amber-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmCancelId(campaign.id);
                            }}
                            disabled={cancelingCampaign === campaign.id}
                          >
                            {cancelingCampaign === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Ban className="mr-1 h-4 w-4" />
                                Cancelar
                              </>
                            )}
                          </Button>
                        )}
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          {campaign.sent_count} enviada(s)
                        </span>
                        {campaign.failed_count > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3 w-3" />
                            {campaign.failed_count} falha(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message preview */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {campaign.message_template}
                      </p>
                    </div>

                    {/* Expanded content: message logs */}
                    <CollapsibleContent>
                      <div className="mt-4 space-y-2 border-t pt-4">
                        <h4 className="text-sm font-medium">Detalhes de envio</h4>
                        
                        {loadingLogs === campaign.id ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : logs.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">Nenhum log disponível</p>
                        ) : (
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {logs.map((log) => (
                                <div
                                  key={log.id}
                                  className={`flex items-center justify-between rounded-lg border p-2 text-sm ${
                                    log.status === "failed" ? "border-destructive/50 bg-destructive/5" : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {getMessageStatusIcon(log.status)}
                                    <div>
                                      <p className="font-medium">{log.recipient_name || "Sem nome"}</p>
                                      <p className="text-xs text-muted-foreground">{log.recipient_phone}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {log.status === "failed" && log.error_message && (
                                      <div className="flex items-center gap-1 text-xs text-destructive">
                                        <AlertCircle className="h-3 w-3" />
                                        <span className="max-w-[150px] truncate">{log.error_message}</span>
                                      </div>
                                    )}
                                    {log.sent_at && (
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(log.sent_at), "HH:mm:ss")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      <AlertDialog open={!!confirmCancelId} onOpenChange={(open) => !open && setConfirmCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta campanha? Os envios pendentes serão interrompidos e não poderão ser retomados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (confirmCancelId) {
                  handleCancelCampaign(confirmCancelId);
                  setConfirmCancelId(null);
                }
              }}
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
