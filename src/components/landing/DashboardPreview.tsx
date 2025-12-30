import { TrendingUp, Calendar, DollarSign, Users } from "lucide-react";

const metrics = [
  {
    icon: DollarSign,
    label: "Faturamento Hoje",
    value: "R$ 2.450",
    change: "+12%",
  },
  {
    icon: Calendar,
    label: "Agendamentos",
    value: "18",
    change: "+5%",
  },
  {
    icon: TrendingUp,
    label: "Ticket Médio",
    value: "R$ 85",
    change: "+8%",
  },
  {
    icon: Users,
    label: "Atendimentos/Mês",
    value: "342",
    change: "+15%",
  },
];

const chartData = [
  { day: "Seg", value: 65 },
  { day: "Ter", value: 80 },
  { day: "Qua", value: 55 },
  { day: "Qui", value: 90 },
  { day: "Sex", value: 100 },
  { day: "Sáb", value: 85 },
  { day: "Dom", value: 40 },
];

export function DashboardPreview() {
  const maxValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="w-full h-full bg-charcoal rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-sidebar-background px-4 py-2 flex items-center gap-2 border-b border-border/30">
        <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
          <span className="text-gold text-xs font-bold">B</span>
        </div>
        <span className="text-foreground text-sm font-medium">Dashboard</span>
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-muted-foreground text-xs">Online</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 space-y-3">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-sidebar-background rounded-lg p-2 border border-border/30"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <metric.icon className="w-3 h-3 text-gold" />
                <span className="text-muted-foreground text-[10px]">
                  {metric.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-foreground text-sm font-bold">
                  {metric.value}
                </span>
                <span className="text-green-500 text-[10px]">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-sidebar-background rounded-lg p-2 border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[10px]">
              Faturamento Semanal
            </span>
            <span className="text-gold text-[10px] font-medium">R$ 12.450</span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-gold to-gold/60 rounded-t"
                  style={{ height: `${(item.value / maxValue) * 100}%` }}
                ></div>
                <span className="text-muted-foreground text-[8px]">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Popular Services */}
          <div className="bg-sidebar-background rounded-lg p-2 border border-border/30">
            <span className="text-muted-foreground text-[10px] block mb-1.5">
              Serviços Populares
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gold"></div>
                <span className="text-foreground text-[9px]">Corte</span>
                <span className="text-muted-foreground text-[9px] ml-auto">45%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-neon"></div>
                <span className="text-foreground text-[9px]">Barba</span>
                <span className="text-muted-foreground text-[9px] ml-auto">30%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gold/50"></div>
                <span className="text-foreground text-[9px]">Combo</span>
                <span className="text-muted-foreground text-[9px] ml-auto">25%</span>
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-sidebar-background rounded-lg p-2 border border-border/30">
            <span className="text-muted-foreground text-[10px] block mb-1.5">
              Próximos Horários
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-gold text-[9px] font-medium">14:00</span>
                <span className="text-foreground text-[9px]">João Silva</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gold text-[9px] font-medium">14:30</span>
                <span className="text-foreground text-[9px]">Pedro Santos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gold text-[9px] font-medium">15:00</span>
                <span className="text-foreground text-[9px]">Carlos Lima</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
