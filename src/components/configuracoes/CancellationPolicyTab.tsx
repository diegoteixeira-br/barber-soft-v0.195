import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Ban, Clock, Loader2, AlertTriangle, UserX } from "lucide-react";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { Slider } from "@/components/ui/slider";

export function CancellationPolicyTab() {
  const { settings, isLoading, updateSettings } = useBusinessSettings();
  
  const [formData, setFormData] = useState({
    cancellation_time_limit_hours: 24,
    late_cancellation_fee_percent: 50,
    no_show_fee_percent: 100,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        cancellation_time_limit_hours: settings.cancellation_time_limit_hours ?? 24,
        late_cancellation_fee_percent: settings.late_cancellation_fee_percent ?? 50,
        no_show_fee_percent: settings.no_show_fee_percent ?? 100,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-primary" />
            Política de Cancelamento
          </CardTitle>
          <CardDescription>
            Configure as regras de cancelamento e taxas aplicáveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Tempo limite para cancelar sem custo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base font-medium">
                  Tempo Limite para Cancelar Sem Custo
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                O cliente pode cancelar gratuitamente até este período antes do agendamento
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={formData.cancellation_time_limit_hours}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    cancellation_time_limit_hours: parseInt(e.target.value) || 24 
                  }))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">horas antes do horário agendado</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  <strong>Exemplo:</strong> Se configurado para {formData.cancellation_time_limit_hours}h, 
                  um agendamento para 14:00 pode ser cancelado sem custo até{" "}
                  {formData.cancellation_time_limit_hours >= 24 
                    ? `${Math.floor(formData.cancellation_time_limit_hours / 24)} dia(s) antes às 14:00`
                    : `${formData.cancellation_time_limit_hours}h antes (${14 - (formData.cancellation_time_limit_hours % 24)}:00)`
                  }
                </p>
              </div>
            </div>

            {/* Taxa para cancelamento tardio */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <Label className="text-base font-medium">
                  Taxa para Cancelamento Tardio
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Percentual do valor do serviço cobrado quando o cliente cancela após o prazo
              </p>
              <div className="space-y-3">
                <Slider
                  value={[formData.late_cancellation_fee_percent]}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    late_cancellation_fee_percent: value[0] 
                  }))}
                  max={100}
                  step={5}
                  className="w-full max-w-md"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.late_cancellation_fee_percent}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      late_cancellation_fee_percent: parseInt(e.target.value) || 0 
                    }))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">% do valor do serviço</span>
                </div>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-4 text-sm border border-orange-500/20">
                <p className="text-orange-700 dark:text-orange-400">
                  <strong>Cancelamento Tardio:</strong> Para um serviço de R$ 50,00, 
                  a taxa será de <strong>R$ {((50 * formData.late_cancellation_fee_percent) / 100).toFixed(2)}</strong>
                </p>
              </div>
            </div>

            {/* Taxa para no-show */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                <Label className="text-base font-medium">
                  Taxa para No-Show (Não Comparecimento)
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Percentual do valor do serviço cobrado quando o cliente não comparece
              </p>
              <div className="space-y-3">
                <Slider
                  value={[formData.no_show_fee_percent]}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    no_show_fee_percent: value[0] 
                  }))}
                  max={100}
                  step={5}
                  className="w-full max-w-md"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.no_show_fee_percent}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      no_show_fee_percent: parseInt(e.target.value) || 0 
                    }))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">% do valor do serviço</span>
                </div>
              </div>
              <div className="bg-destructive/10 rounded-lg p-4 text-sm border border-destructive/20">
                <p className="text-destructive">
                  <strong>No-Show:</strong> Para um serviço de R$ 50,00, 
                  a taxa será de <strong>R$ {((50 * formData.no_show_fee_percent) / 100).toFixed(2)}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Política
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resumo da Política */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Resumo da Política</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>
                <strong>Cancelamento Gratuito:</strong> Até {formData.cancellation_time_limit_hours} horas antes do horário agendado
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 font-bold">!</span>
              <span>
                <strong>Cancelamento Tardio:</strong> Taxa de {formData.late_cancellation_fee_percent}% do valor do serviço
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive font-bold">✕</span>
              <span>
                <strong>Não Comparecimento:</strong> Taxa de {formData.no_show_fee_percent}% do valor do serviço
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
