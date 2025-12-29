import { useState } from "react";
import { Send, Users, Cake, UserX, Search, CheckSquare, Square, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useClients, type ClientFilter } from "@/hooks/useClients";
import { useUnits } from "@/hooks/useUnits";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const filterOptions = [
  { value: "all", label: "Todos os Clientes", icon: Users },
  { value: "birthday_month", label: "Aniversariantes do Mês", icon: Cake },
  { value: "inactive", label: "Sumidos (30+ dias)", icon: UserX },
];

export function CampaignsTab() {
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { units } = useUnits();
  const { clients, isLoading } = useClients({
    filter,
    unitIdFilter: unitFilter === "all" ? null : unitFilter,
  });

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const showUnitBadge = unitFilter === "all" && units.length > 1;

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const handleSendCampaign = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "Selecione pelo menos um cliente", variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({ title: "Digite uma mensagem", variant: "destructive" });
      return;
    }

    setIsSending(true);
    
    try {
      const targets = selectedClients.map((c) => ({
        phone: c.phone,
        name: c.name,
      }));

      const { data, error } = await supabase.functions.invoke("send-marketing-campaign", {
        body: {
          message_template: message,
          targets,
        },
      });

      if (error) {
        console.error("Error sending campaign:", error);
        toast({
          title: "Erro ao enviar campanha",
          description: error.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Campanha enviada!",
        description: data?.message || `Mensagem enviada para ${selectedIds.size} cliente(s).`,
      });
      
      setSelectedIds(new Set());
      setMessage("");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Erro inesperado",
        description: "Não foi possível enviar a campanha.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const selectedClients = clients.filter((c) => selectedIds.has(c.id));

  return (
    <div className="space-y-6">
      {/* Filter and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Unit Filter */}
          {units.length > 1 && (
            <Select value={unitFilter} onValueChange={(v) => { setUnitFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filter} onValueChange={(v) => { setFilter(v as ClientFilter); setSelectedIds(new Set()); }}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filtrar clientes" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-[300px]"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Clientes</CardTitle>
                <CardDescription>
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} de ${filteredClients.length} selecionados`
                    : `${filteredClients.length} cliente(s) encontrado(s)`
                  }
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedIds.size === filteredClients.length && filteredClients.length > 0 ? (
                  <><CheckSquare className="mr-2 h-4 w-4" /> Desmarcar</>
                ) : (
                  <><Square className="mr-2 h-4 w-4" /> Selecionar Todos</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto h-12 w-12 opacity-30" />
                <p className="mt-2">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => toggleSelection(client.id)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedIds.has(client.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox checked={selectedIds.has(client.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.phone}</p>
                      {showUnitBadge && client.unit_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Building2 className="h-3 w-3" />
                          <span>{client.unit_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {client.birth_date && (
                        <Badge variant="outline" className="mb-1">
                          <Cake className="mr-1 h-3 w-3" />
                          {client.birth_date.split("-").slice(1).reverse().join("/")}
                        </Badge>
                      )}
                      {client.last_visit_at && (
                        <p>Última visita: {format(new Date(client.last_visit_at), "dd/MM/yy")}</p>
                      )}
                      <p>{client.total_visits} visita(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensagem da Campanha</CardTitle>
            <CardDescription>
              Use <code className="rounded bg-muted px-1">{"{{nome}}"}</code> para personalizar com o nome do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Olá {{nome}}! Temos uma promoção especial para você..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[200px] resize-none"
            />

            {message && selectedClients.length > 0 && (
              <div className="rounded-lg border border-dashed p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Prévia:</p>
                <p className="text-sm">
                  {message.replace(/\{\{nome\}\}/g, selectedClients[0]?.name || "Cliente")}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSendCampaign}
              disabled={isSending || selectedIds.size === 0 || !message.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending
                ? "Enviando..."
                : `Enviar Campanha (${selectedIds.size} cliente${selectedIds.size !== 1 ? "s" : ""})`
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
