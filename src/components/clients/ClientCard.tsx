import { Phone, Calendar, Clock, Edit2, Trash2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Client } from "@/hooks/useClients";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  showUnit?: boolean;
}

export function ClientCard({ client, onEdit, onDelete, showUnit = false }: ClientCardProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formatBirthDate = (date: string | null) => {
    if (!date) return null;
    const [, month, day] = date.split('-');
    return `${day}/${month}`;
  };

  const formatLastVisit = (date: string | null) => {
    if (!date) return "Nunca visitou";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const tagColors: Record<string, string> = {
    VIP: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Sumido: "bg-red-500/20 text-red-400 border-red-500/30",
    Novo: "bg-green-500/20 text-green-400 border-green-500/30",
    Frequente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <Card className="border-border bg-card transition-all hover:border-primary/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{client.phone}</span>
              </div>
              {showUnit && client.unit_name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Building2 className="h-3 w-3 text-primary" />
                  <span className="truncate">{client.unit_name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(client)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(client)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          {client.birth_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formatBirthDate(client.birth_date)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{formatLastVisit(client.last_visit_at)}</span>
          </div>
          <div className="text-right text-muted-foreground">
            <span className="font-medium text-foreground">{client.total_visits}</span> visitas
          </div>
        </div>

        {client.tags && client.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={tagColors[tag] || "bg-secondary text-secondary-foreground"}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
