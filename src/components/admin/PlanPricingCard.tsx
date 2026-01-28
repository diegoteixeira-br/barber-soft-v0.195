import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaasSettings } from "@/hooks/useSaasSettings";
import { DollarSign, Percent, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PlanPricingCard() {
  const { settings, updateSettings, isUpdating } = useSaasSettings();
  
  const [trialDays, setTrialDays] = useState<number>(14);
  const [annualDiscount, setAnnualDiscount] = useState<number>(20);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  
  // Plano Inicial
  const [inicialPrice, setInicialPrice] = useState<number>(99.00);
  const [inicialAnnualPrice, setInicialAnnualPrice] = useState<number>(79.00);
  
  // Plano Profissional
  const [profissionalPrice, setProfissionalPrice] = useState<number>(199.00);
  const [profissionalAnnualPrice, setProfissionalAnnualPrice] = useState<number>(159.00);
  
  // Plano Franquias
  const [franquiasPrice, setFranquiasPrice] = useState<number>(499.00);
  const [franquiasAnnualPrice, setFranquiasAnnualPrice] = useState<number>(399.00);

  useEffect(() => {
    if (settings) {
      setTrialDays(settings.default_trial_days || 14);
      setAnnualDiscount(settings.annual_discount_percent || 20);
      setInicialPrice(Number(settings.inicial_plan_price) || 99.00);
      setInicialAnnualPrice(Number(settings.inicial_plan_annual_price) || 79.00);
      setProfissionalPrice(Number(settings.profissional_plan_price) || 199.00);
      setProfissionalAnnualPrice(Number(settings.profissional_plan_annual_price) || 159.00);
      setFranquiasPrice(Number(settings.franquias_plan_price) || 499.00);
      setFranquiasAnnualPrice(Number(settings.franquias_plan_annual_price) || 399.00);
    }
  }, [settings]);

  const handleSave = async () => {
    // Primeiro salvar no banco
    updateSettings({
      default_trial_days: trialDays,
      annual_discount_percent: annualDiscount,
      inicial_plan_price: inicialPrice,
      inicial_plan_annual_price: inicialAnnualPrice,
      profissional_plan_price: profissionalPrice,
      profissional_plan_annual_price: profissionalAnnualPrice,
      franquias_plan_price: franquiasPrice,
      franquias_plan_annual_price: franquiasAnnualPrice,
    } as any);
  };

  const handleSyncStripe = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe-products');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSyncResult(data);
      
      if (data.success) {
        if (data.results.errors.length === 0) {
          toast.success("Sincronização concluída com sucesso!");
        } else {
          toast.warning("Sincronização parcial. Verifique os avisos.");
        }
      } else {
        toast.error(data.error || "Erro na sincronização");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erro ao sincronizar com Stripe");
      setSyncResult({ success: false, error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateAnnualPrice = (monthlyPrice: number) => {
    return (monthlyPrice * (1 - annualDiscount / 100)).toFixed(2);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-600/20 text-green-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-white">Preços dos Planos</CardTitle>
              <CardDescription className="text-slate-400">
                Configure os preços mensais e anuais de cada plano
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleSyncStripe}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Stripe"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Result */}
        {syncResult && (
          <div className={`p-4 rounded-lg border ${
            syncResult.success && syncResult.results?.errors.length === 0 
              ? 'bg-green-900/20 border-green-700/50' 
              : syncResult.success 
                ? 'bg-yellow-900/20 border-yellow-700/50'
                : 'bg-red-900/20 border-red-700/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {syncResult.success && syncResult.results?.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              )}
              <span className="text-white font-medium">
                {syncResult.success ? "Sincronização concluída" : "Erro na sincronização"}
              </span>
            </div>
            {syncResult.results?.products_updated?.length > 0 && (
              <p className="text-sm text-green-400 mb-1">
                ✓ Produtos atualizados: {syncResult.results.products_updated.join(", ")}
              </p>
            )}
            {syncResult.results?.errors?.length > 0 && (
              <div className="space-y-1">
                {syncResult.results.errors.map((err: string, i: number) => (
                  <p key={i} className="text-sm text-yellow-400">{err}</p>
                ))}
              </div>
            )}
            {syncResult.error && (
              <p className="text-sm text-red-400">{syncResult.error}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Trial Padrão (dias)</Label>
            <Input
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
              min={1}
              max={60}
              className="bg-slate-900 border-slate-700 text-white mt-2"
            />
          </div>
          <div>
            <Label className="text-slate-300 flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Desconto Anual
            </Label>
            <div className="relative mt-2">
              <Input
                type="number"
                value={annualDiscount}
                onChange={(e) => setAnnualDiscount(Number(e.target.value))}
                min={0}
                max={50}
                className="bg-slate-900 border-slate-700 text-white pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
            </div>
          </div>
        </div>

        {/* Plano Inicial */}
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <h4 className="text-white font-medium mb-3">Plano Inicial</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-sm">Mensal</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <Input
                  type="number"
                  value={inicialPrice}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setInicialPrice(newPrice);
                    setInicialAnnualPrice(Number(calculateAnnualPrice(newPrice)));
                  }}
                  step="0.01"
                  min={0}
                  className="bg-slate-900 border-slate-700 text-white pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Anual (por mês)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <Input
                  type="number"
                  value={inicialAnnualPrice}
                  onChange={(e) => setInicialAnnualPrice(Number(e.target.value))}
                  step="0.01"
                  min={0}
                  className="bg-slate-900 border-slate-700 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Plano Profissional */}
        <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-700/50">
          <h4 className="text-white font-medium mb-3">Plano Profissional</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-sm">Mensal</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <Input
                  type="number"
                  value={profissionalPrice}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setProfissionalPrice(newPrice);
                    setProfissionalAnnualPrice(Number(calculateAnnualPrice(newPrice)));
                  }}
                  step="0.01"
                  min={0}
                  className="bg-slate-900 border-slate-700 text-white pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Anual (por mês)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <Input
                  type="number"
                  value={profissionalAnnualPrice}
                  onChange={(e) => setProfissionalAnnualPrice(Number(e.target.value))}
                  step="0.01"
                  min={0}
                  className="bg-slate-900 border-slate-700 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Plano Franquias */}
        <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700/50">
          <h4 className="text-white font-medium mb-3">Plano Franquias</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-400 text-sm">Mensal</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <Input
                  type="number"
                  value={franquiasPrice}
                  onChange={(e) => {
                    const newPrice = Number(e.target.value);
                    setFranquiasPrice(newPrice);
                    setFranquiasAnnualPrice(Number(calculateAnnualPrice(newPrice)));
                  }}
                  step="0.01"
                  min={0}
                  className="bg-slate-900 border-slate-700 text-white pl-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Anual (por mês)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                <Input
                  type="number"
                  value={franquiasAnnualPrice}
                  onChange={(e) => setFranquiasAnnualPrice(Number(e.target.value))}
                  step="0.01"
                  min={0}
                  className="bg-slate-900 border-slate-700 text-white pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSave}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? "Salvando..." : "Salvar Preços"}
          </Button>
          <Button 
            onClick={async () => {
              await handleSave();
              setTimeout(handleSyncStripe, 500);
            }}
            disabled={isUpdating || isSyncing}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isSyncing ? "Sincronizando..." : "Salvar e Sincronizar"}
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          ⚠️ O Stripe não permite alterar preços existentes. Para mudar valores, crie novos preços no Stripe Dashboard.
          As features são sincronizadas como metadados dos produtos.
        </p>
      </CardContent>
    </Card>
  );
}
