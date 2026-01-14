import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "info" | "danger";
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-emerald-500/10 border-emerald-500/30",
  warning: "bg-primary/10 border-primary/30",
  info: "bg-blue-500/10 border-blue-500/30",
  danger: "bg-red-500/10 border-red-500/30",
};

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-emerald-500",
  warning: "text-primary",
  info: "text-blue-500",
  danger: "text-red-500",
};

export function RevenueCard({ title, value, subtitle, icon: Icon, variant = "default" }: RevenueCardProps) {
  return (
    <Card className={cn("border transition-all hover:scale-[1.02]", variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("p-3 rounded-full bg-background/50", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
