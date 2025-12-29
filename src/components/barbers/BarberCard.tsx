import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Barber } from "@/hooks/useBarbers";
import { Pencil, Trash2, Phone, Percent, Building2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

interface BarberCardProps {
  barber: Barber;
  onEdit: (barber: Barber) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  showUnit?: boolean;
}

export function BarberCard({ barber, onEdit, onDelete, onToggleActive, showUnit = false }: BarberCardProps) {
  const initials = barber.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2" style={{ borderColor: barber.calendar_color }}>
              <AvatarImage src={barber.photo_url || undefined} alt={barber.name} />
              <AvatarFallback 
                className="text-foreground font-semibold"
                style={{ backgroundColor: barber.calendar_color + "33" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card"
              style={{ backgroundColor: barber.calendar_color }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{barber.name}</h3>
              <Badge 
                variant={barber.is_active ? "default" : "secondary"}
                className={barber.is_active ? "bg-success text-success-foreground" : ""}
              >
                {barber.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            {barber.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <Phone className="h-3 w-3" />
                <span>{barber.phone}</span>
              </div>
            )}

            {showUnit && barber.unit_name && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                <Building2 className="h-3 w-3 text-primary" />
                <span className="truncate">{barber.unit_name}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Percent className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary">
                {barber.commission_rate}%
              </span>
              <span className="text-sm text-muted-foreground">comissão</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={barber.is_active}
                onCheckedChange={(checked) => onToggleActive(barber.id, checked)}
              />
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => onEdit(barber)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover profissional?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O profissional será removido permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(barber.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
